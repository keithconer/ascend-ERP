import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Plus, Edit } from "lucide-react";

export default function SupplyChainPlanning() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [formData, setFormData] = useState({
    po_number: "",
    requisition_id: "",
    warehouse_id: "",
    forecast_demand: "",
    plan_status: "pending",
  });
  const [autoFilledData, setAutoFilledData] = useState({
    product_name: "",
    supplier_name: "",
    current_stock: "",
    status: "",
  });

  // Fetch supply chain plans with related data and current stock
  const { data: plans, isLoading } = useQuery({
    queryKey: ["supply_chain_plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supply_chain_plans")
        .select(`
          *,
          items (id, name, sku),
          suppliers (id, name),
          warehouses (id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch current stock and forecast demand for each plan
      const enrichedPlans = await Promise.all(
        (data || []).map(async (plan) => {
          // Get current stock (available_quantity)
          const { data: inventoryData } = await supabase
            .from("inventory")
            .select("available_quantity")
            .eq("item_id", plan.product_id)
            .maybeSingle();

          // Get recommended order qty from demand forecasting
          const { data: forecastData } = await supabase
            .from("demand_forecasting")
            .select("recommend_order_qty")
            .eq("product_id", plan.product_id)
            .maybeSingle();

          return {
            ...plan,
            current_stock: inventoryData?.available_quantity ?? 0,
            forecast_demand_value: forecastData?.recommend_order_qty ?? "-",
          };
        })
      );

      return enrichedPlans;
    },
  });

  // Fetch purchase orders
  const { data: purchaseOrders } = useQuery({
    queryKey: ["purchase_orders_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("order_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch requisitions
  const { data: requisitions } = useQuery({
    queryKey: ["purchase_requisitions_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .select("*")
        .order("request_date", { ascending: false});
      if (error) throw error;
      return data;
    },
  });

  // Fetch warehouses
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Auto-populate data when PO number is selected
  useEffect(() => {
    const fetchPODetails = async () => {
      if (!formData.po_number) return;

      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          suppliers (name),
          purchase_order_items (
            items (id, name)
          )
        `)
        .eq("po_number", formData.po_number)
        .single();

      if (poError || !poData) return;

      const productId = poData.purchase_order_items?.[0]?.items?.id;
      const productName = poData.purchase_order_items?.[0]?.items?.name || "";
      const supplierName = poData.suppliers?.name || "";

      // Get current stock
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select("available_quantity")
        .eq("item_id", productId)
        .maybeSingle();

      setAutoFilledData({
        product_name: productName,
        supplier_name: supplierName,
        current_stock: inventoryData?.available_quantity?.toString() || "0",
        status: poData.status,
      });

      // Set requisition ID if exists
      if (poData.requisition_id) {
        setFormData(prev => ({ ...prev, requisition_id: poData.requisition_id }));
      }
    };

    fetchPODetails();
  }, [formData.po_number]);

  // Create supply chain plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get product ID from PO
      const { data: poData } = await supabase
        .from("purchase_orders")
        .select(`
          purchase_order_items (
            items (id)
          ),
          supplier_id
        `)
        .eq("po_number", data.po_number)
        .single();

      const productId = poData?.purchase_order_items?.[0]?.items?.id;
      const supplierId = poData?.supplier_id;

      const { error } = await supabase
        .from("supply_chain_plans")
        .insert([{
          plan_id: "", // Auto-generated by trigger
          po_number: data.po_number,
          requisition_id: data.requisition_id || null,
          product_id: productId,
          supplier_id: supplierId,
          warehouse_id: data.warehouse_id,
          forecast_demand: parseInt(data.forecast_demand),
          plan_status: data.plan_status,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supply chain plan created successfully");
      queryClient.invalidateQueries({ queryKey: ["supply_chain_plans"] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to create plan: ${error.message}`);
    },
  });

  // Update supply chain plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const { error } = await supabase
        .from("supply_chain_plans")
        .update({
          plan_status: data.plan_status,
          warehouse_id: data.warehouse_id,
          forecast_demand: parseInt(data.forecast_demand),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Supply chain plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["supply_chain_plans"] });
      queryClient.invalidateQueries({ queryKey: ["purchase_orders"] });
      queryClient.invalidateQueries({ queryKey: ["goods_receipts"] });
      setIsAddDialogOpen(false);
      setSelectedPlan(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to update plan: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      po_number: "",
      requisition_id: "",
      warehouse_id: "",
      forecast_demand: "",
      plan_status: "pending",
    });
    setAutoFilledData({
      product_name: "",
      supplier_name: "",
      current_stock: "",
      status: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.po_number || !formData.warehouse_id || !formData.forecast_demand) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedPlan) {
      updatePlanMutation.mutate({ id: selectedPlan.id, data: formData });
    } else {
      createPlanMutation.mutate(formData);
    }
  };

  const handleEdit = (plan: any) => {
    setSelectedPlan(plan);
    setFormData({
      po_number: plan.po_number || "",
      requisition_id: plan.requisition_id || "",
      warehouse_id: plan.warehouse_id,
      forecast_demand: plan.forecast_demand.toString(),
      plan_status: plan.plan_status,
    });
    setIsAddDialogOpen(true);
  };

  const filteredPlans = (plans || []).filter((plan) => {
    const search = searchTerm.toLowerCase();
    return (
      plan.plan_id?.toLowerCase().includes(search) ||
      plan.po_number?.toLowerCase().includes(search) ||
      plan.items?.name?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "secondary",
      approved: "default",
      delayed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading supply chain plans...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supply Chain Planning</h2>
          <p className="text-sm text-muted-foreground">
            Manage supply chain plans linked to procurement orders
          </p>
        </div>
        <Button onClick={() => {
          setSelectedPlan(null);
          resetForm();
          setIsAddDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Supply Plan
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Plan ID, PO Number, or Product..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Plans Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan ID</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Requisition ID</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Forecast Demand</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No supply chain plans found. Create your first plan to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.plan_id}</TableCell>
                      <TableCell>{plan.po_number || "—"}</TableCell>
                      <TableCell>{plan.requisition_id || "—"}</TableCell>
                      <TableCell>{plan.current_stock} units</TableCell>
                      <TableCell>{plan.suppliers?.name || "—"}</TableCell>
                      <TableCell>{getStatusBadge(plan.plan_status)}</TableCell>
                      <TableCell>{plan.warehouses?.name || "—"}</TableCell>
                      <TableCell>{plan.forecast_demand_value !== "-" ? `${plan.forecast_demand_value} units` : "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? "Edit Supply Plan" : "Add New Supply Plan"}
            </DialogTitle>
            <DialogDescription>
              Select a purchase order to auto-populate product and supplier details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* PO Number */}
              <div className="space-y-2">
                <Label>PO Number *</Label>
                <Select
                  value={formData.po_number}
                  onValueChange={(value) =>
                    setFormData({ ...formData, po_number: value })
                  }
                  disabled={!!selectedPlan}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select PO number" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchaseOrders?.map((po) => (
                      <SelectItem key={po.id} value={po.po_number || po.id}>
                        {po.po_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Requisition No (Auto-populated) */}
              <div className="space-y-2">
                <Label>Requisition No.</Label>
                <Input
                  value={formData.requisition_id}
                  disabled
                  className="bg-muted"
                  placeholder="Auto-filled from PO"
                />
              </div>

              {/* Product Name (Auto Display) */}
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input
                  value={autoFilledData.product_name}
                  disabled
                  className="bg-muted"
                  placeholder="Select PO number"
                />
              </div>

              {/* Current Stock (Auto Display) */}
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input
                  value={autoFilledData.current_stock ? `${autoFilledData.current_stock} units` : ""}
                  disabled
                  className="bg-muted"
                  placeholder="Select PO number"
                />
              </div>

              {/* Supplier (Auto Display) */}
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  value={autoFilledData.supplier_name}
                  disabled
                  className="bg-muted"
                  placeholder="Select PO number"
                />
              </div>

              {/* Warehouse */}
              <div className="space-y-2">
                <Label>Warehouse Location *</Label>
                <Select
                  value={formData.warehouse_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, warehouse_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Forecast Demand */}
              <div className="space-y-2">
                <Label>Forecast Demand (units) *</Label>
                <Input
                  type="number"
                  placeholder="Enter forecast demand"
                  value={formData.forecast_demand}
                  onChange={(e) =>
                    setFormData({ ...formData, forecast_demand: e.target.value })
                  }
                />
              </div>

              {/* Plan Status */}
              <div className="space-y-2">
                <Label>Plan Status *</Label>
                <Select
                  value={formData.plan_status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, plan_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Setting status to "delayed" will update PO and GR status
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setSelectedPlan(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
              >
                {selectedPlan ? "Update Plan" : "Save Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
