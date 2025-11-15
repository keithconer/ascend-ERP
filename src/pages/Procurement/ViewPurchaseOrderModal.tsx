import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PurchaseOrder } from "./PurchaseOrderTable";

interface ItemRow {
  id: string;
  item_id: { id: string; name: string; unit_price?: number };
  quantity: number;
  price: number;
}

interface Warehouse {
  id: string;
  name: string;
}

interface ViewPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  onUpdated: () => void;
}

export default function ViewPurchaseOrderModal({
  open,
  onClose,
  purchaseOrder,
  onUpdated,
}: ViewPurchaseOrderModalProps) {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [status, setStatus] = useState(purchaseOrder?.status || "pending");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (open && purchaseOrder) {
      fetchItems();
      fetchWarehouses();
      setStatus(purchaseOrder.status);
    } else {
      setItems([]);
      setWarehouses([]);
      setSelectedWarehouseId(null);
    }
  }, [open, purchaseOrder]);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("purchase_order_items")
      .select("id, quantity, price, item_id(id,name,unit_price)")
      .eq("purchase_order_id", purchaseOrder.id);

    if (error) {
      toast({ title: "Error fetching PO items", description: error.message });
      setItems([]);
    } else {
      setItems(data || []);
    }
  }

  async function fetchWarehouses() {
    const { data, error } = await supabase
      .from("warehouses")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      toast({ title: "Error fetching warehouses", description: error.message });
      setWarehouses([]);
    } else {
      setWarehouses(data || []);
      if (data && data.length > 0) {
        setSelectedWarehouseId(data[0].id);
      }
    }
  }

  async function handleApprove() {
    if (!selectedWarehouseId) {
      toast({
        title: "Warehouse required",
        description: "Please select a warehouse before approving the purchase order.",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "approved" })
        .eq("id", purchaseOrder.id);

      if (error) throw error;

      const stockItems = items.map((it) => {
        const unitCost = it.price !== 0 ? it.price : it.item_id.unit_price ?? 0;

        return {
          item_id: it.item_id.id,
          warehouse_id: selectedWarehouseId,
          transaction_type: "stock-in",
          quantity: it.quantity,
          reference_number: purchaseOrder.po_number,
          notes: `Receipt from PO ${purchaseOrder.po_number}`,
          unit_cost: unitCost,
          total_cost: unitCost * it.quantity,
          created_at: new Date().toISOString(),
        };
      });

      const { error: stError } = await supabase.from("stock_transactions").insert(stockItems);

      if (stError) throw stError;

      toast({ title: "PO approved", description: "Stock transactions recorded." });
      onUpdated();
      onClose();
    } catch (error: any) {
      toast({ title: "Error approving PO", description: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate() {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status })
        .eq("id", purchaseOrder.id);

      if (error) throw error;

      toast({
        title: "Status updated successfully",
        description: status === "delayed" ? "Goods receipt status has also been updated to delayed" : undefined,
      });

      onUpdated();
      onClose();
    } catch (error: any) {
      toast({ title: "Failed to update status", description: error.message });
    } finally {
      setLoading(false);
    }
  }

  const total = items.reduce((acc, it) => {
    const price = it.price !== 0 ? it.price : it.item_id.unit_price ?? 0;
    return acc + price * it.quantity;
  }, 0);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Purchase Order Details</DialogTitle>
          <DialogDescription>PO {purchaseOrder.po_number}</DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <p>
              <strong>Status:</strong> {purchaseOrder.status}
            </p>
            <p>
              <strong>Order Date:</strong>{" "}
              {purchaseOrder.order_date ? format(new Date(purchaseOrder.order_date), "PPP") : "-"}
            </p>
            <p>
              <strong>Notes:</strong> {purchaseOrder.notes || "-"}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            <ul className="list-disc list-inside border rounded p-2 bg-muted">
              {items.length === 0 && <li>No items in PO.</li>}
              {items.map((it) => {
                const price = it.price !== 0 ? it.price : it.item_id.unit_price ?? 0;
                return (
                  <li key={it.id}>
                    {it.item_id.name} — Qty: {it.quantity} @ ₱{price.toFixed(2)} each
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 font-semibold text-right">
              Total: ₱{total.toFixed(2)}
            </div>
          </div>

          {purchaseOrder.status.toLowerCase().trim() !== "approved" && (
            <>
              <div>
                <label htmlFor="warehouse-select" className="block font-semibold mb-1">
                  Select Warehouse
                </label>
                <select
                  id="warehouse-select"
                  className="w-full border rounded px-3 py-2"
                  value={selectedWarehouseId || ""}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  {warehouses.length === 0 && <option value="">No warehouses available</option>}
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status-select" className="block font-semibold mb-1">
                  Update Status
                </label>
                <div className="flex items-center gap-2">
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleStatusUpdate}
                    disabled={loading || status === purchaseOrder.status}
                    size="sm"
                  >
                    Update
                  </Button>
                </div>
                {status === "delayed" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: Setting to "delayed" will also update goods receipt status
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={loading}>
            Close
          </Button>
          {purchaseOrder.status.toLowerCase().trim() !== "approved" && (
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Approving..." : "Approve PO"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
