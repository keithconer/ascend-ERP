'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { EyeIcon, Trash2 } from "lucide-react";
import { format } from "date-fns";
import PurchaseOrderForm from "./PurchaseOrderForm";
import ViewPurchaseOrderModal from "./ViewPurchaseOrderModal";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Item {
  item_name: string;
  quantity: number;
  price: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  requisition: {
    id: string;
  } | null;
  supplier_name: string;
  order_date: string;
  status: string;
  notes: string | null;
  items: Item[];
  total: number;
}

export default function PurchaseOrderTable() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showView, setShowView] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    // whenever searchTerm changes, refetch with filter
    fetchPurchaseOrders();
  }, [searchTerm]);

  async function fetchPurchaseOrders() {
    setLoading(true);

    // Build base query with an inner join for suppliers so name filter works
    let query = supabase
      .from("purchase_orders")
      .select(`
        id,
        po_number,
        order_date,
        status,
        notes,
        requisition: purchase_requisitions (
          id
        ),
        supplier: suppliers!inner (
          name
        ),
        purchase_order_items (
          quantity,
          price,
          items: items (
            id,
            name,
            unit_price
          )
        )
      `)
      .order("order_date", { ascending: false });

    // If searchTerm has content, apply filter
    if (searchTerm.trim()) {
      query = query.ilike("supplier.name", `%${searchTerm.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error loading purchase orders",
        description: error.message,
        variant: "destructive",
      });
      setPurchaseOrders([]);
    } else {
      const transformed = (data || []).map((po: any) => {
        const items: Item[] = (po.purchase_order_items || []).map((i: any) => ({
          item_name: i.items?.name ?? "Unknown",
          quantity: i.quantity,
          price: i.items?.unit_price ?? i.price ?? 0,
        }));

        const total = items.reduce(
          (acc: number, i: Item) => acc + i.price * i.quantity,
          0
        );

        return {
          id: po.id,
          po_number: po.po_number,
          requisition: po.requisition,
          supplier_name: po.supplier?.name ?? "Unknown Supplier",
          order_date: po.order_date,
          status: po.status,
          notes: po.notes,
          items,
          total,
        };
      });

      setPurchaseOrders(transformed);
    }

    setLoading(false);
  }

  function openNewForm() {
    setSelected(null);
    setShowForm(true);
  }

  function openViewModal(po: PurchaseOrder) {
    setSelected(po);
    setShowView(true);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this purchase order? This action cannot be undone."
    );
    if (!confirmed) return;

    setDeletingId(id);
    try {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", id);
      if (error) throw error;

      toast({
        title: "Purchase order deleted",
        variant: "success",
      });

      fetchPurchaseOrders();
    } catch (err: any) {
      toast({
        title: "Failed to delete purchase order",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between mb-4 items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search by supplier name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-64"
          />
          <Button onClick={openNewForm}>New Purchase Order</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Requisition</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && purchaseOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            )}
            {purchaseOrders.map((po) => (
              <TableRow key={po.id}>
                <TableCell>{po.po_number}</TableCell>
                <TableCell>{po.requisition?.id ? po.requisition.id.slice(0, 8) : "-"}</TableCell>
                <TableCell>{po.supplier_name}</TableCell>
                <TableCell>{format(new Date(po.order_date), "PPP")}</TableCell>
                <TableCell>{po.status}</TableCell>
                <TableCell>
                  {po.items.map((i) => `${i.item_name} (${i.quantity})`).join(", ")}
                </TableCell>
                <TableCell>${po.total.toFixed(2)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewModal(po)}
                    aria-label="View Purchase Order"
                    disabled={deletingId === po.id}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(po.id)}
                    aria-label="Delete Purchase Order"
                    disabled={deletingId === po.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {showForm && (
        <PurchaseOrderForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onCreated={fetchPurchaseOrders}
        />
      )}

      {selected && showView && (
        <ViewPurchaseOrderModal
          open={showView}
          onClose={() => setShowView(false)}
          purchaseOrder={selected}
          onUpdated={fetchPurchaseOrders}
        />
      )}
    </>
  );
}
