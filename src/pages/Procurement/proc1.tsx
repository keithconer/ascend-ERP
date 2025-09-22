import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ERPLayout } from "@/components/erp/ERPLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

import { PurchaseRequisitionTable } from "./PurchaseRequisitionTable";
import { SupplierManagementTable } from "./SupplierManagementTable";
import { PurchaseOrderManagement } from "./PurchaseOrderManagement";
import { GoodsReceiptMatching } from "./GoodsReceiptMatching";
import { AddRequisitionDialog } from "./AddRequisitionDialog";

/**
 * MOCK / placeholder Inventory update function.
 * Replace this with your real inventory updating logic.
 * For example, updating stock levels in your inventory DB.
 */
async function updateInventoryStock(receiptItems: Array<{ product_id: string; quantity: number }>) {
  // Example: Loop through each item in goods receipt and update stock.
  for (const item of receiptItems) {
    // await your inventory update API / supabase call here
    // Example:
    // await supabase.from("inventory").upsert({ product_id: item.product_id, quantity: increment })
  }
  console.log("Inventory updated for receipt items:", receiptItems);
}

export default function ProcurementManagement() {
  const [showAddRequisition, setShowAddRequisition] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("requisitions");

  // Fetch procurement stats (counts)
  const { data: procurementStats } = useQuery({
    queryKey: ["procurement-stats"],
    queryFn: async () => {
      const [pendingReq, activeSuppliersCount, openPOs, pendingReceipts] =
        await Promise.all([
          supabase
            .from("purchase_requisitions")
            .select("*", { count: "exact", head: true })
            .eq("status", "PENDING"),
          supabase
            .from("suppliers")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("purchase_orders")
            .select("*", { count: "exact", head: true })
            .in("status", ["sent", "confirmed", "delivered"]),
          supabase
            .from("goods_receipts")
            .select("*", { count: "exact", head: true })
            .eq("is_verified", false),
        ]);

      return {
        pendingRequisitions: pendingReq.count || 0,
        activeSuppliersCount: activeSuppliersCount.count || 0,
        openPOs: openPOs.count || 0,
        pendingReceipts: pendingReceipts.count || 0,
      };
    },
  });

  // Fetch full active suppliers list (data)
  const { data: activeSuppliersData, refetch: refetchSuppliers } = useQuery({
    queryKey: ["suppliers", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes caching, adjust as needed
  });

  // Callback to refresh procurement stats and active suppliers data
  const handleSuppliersChanged = () => {
    queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });
    queryClient.invalidateQueries({ queryKey: ["suppliers", "active"] });
  };

  const handleRequisitionAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
    queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });
  };

  const handleAddSupplier = (newSupplier: any) => {
    // Optimistically add the new supplier to the active suppliers list
    queryClient.setQueryData(["suppliers", "active"], (oldData: any) => {
      return [newSupplier, ...(oldData || [])];
    });

    // Invalidate the stats query to refresh the count
    queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });

    // Optionally refetch suppliers if needed
    refetchSuppliers();
  };

  /**
   * Integration Point:
   * This function is called when goods receipt is verified and accepted.
   * It triggers inventory stock update, then refreshes procurement stats.
   */
  const handleGoodsReceiptVerified = async (receiptItems: Array<{ product_id: string; quantity: number }>) => {
    try {
      // 1. Update inventory stock levels based on receipt items
      await updateInventoryStock(receiptItems);

      // 2. Invalidate procurement stats and related queries so UI updates
      queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] }); // Assuming you have such a query key

      // Optionally refresh other procurement related data if needed
    } catch (error) {
      console.error("Error updating inventory after goods receipt verification", error);
    }
  };

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Procurement (Purchasing)</h1>
            <p className="text-muted-foreground">
              Manage requisitions, suppliers, purchase orders, and goods receipt
            </p>
          </div>
          {/* Only show the button for "New Requisition" when the requisitions tab is active */}
          {activeTab === "requisitions" && (
            <Button onClick={() => setShowAddRequisition(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Requisition
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {procurementStats?.pendingRequisitions || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {procurementStats?.activeSuppliersCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">Registered vendors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {procurementStats?.openPOs || 0}
              </div>
              <p className="text-xs text-muted-foreground">Currently in process</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goods Receipts Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {procurementStats?.pendingReceipts || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting verification</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          defaultValue="requisitions"
          className="space-y-4"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="goods-receipt">Goods Receipt</TabsTrigger>
          </TabsList>

          <TabsContent value="requisitions">
            <PurchaseRequisitionTable />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierManagementTable
              activeSuppliers={activeSuppliersData || []}
              onSuppliersChanged={handleSuppliersChanged}
              setShowAddSupplier={setShowAddSupplier}
              onAddSupplier={handleAddSupplier} // Pass the handler to add a supplier
            />
          </TabsContent>

          <TabsContent value="purchase-orders">
            <PurchaseOrderManagement />
          </TabsContent>

          <TabsContent value="goods-receipt">
            <GoodsReceiptMatching
              onReceiptVerified={handleGoodsReceiptVerified} // Pass down to handle inventory update
            />
          </TabsContent>
        </Tabs>

        {/* Add Requisition Dialog */}
        <AddRequisitionDialog
          open={showAddRequisition}
          onOpenChange={setShowAddRequisition}
          onRequisitionAdded={handleRequisitionAdded}
        />
      </div>
    </ERPLayout>
  );
}
