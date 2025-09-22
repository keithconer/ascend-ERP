// src/pages/procurement/ViewRequisitionModal.tsx

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
import { Requisition } from "./PurchaseRequisitionTable";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Helper to generate PO number like 20250923-abc123
function generatePONumber(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${datePart}-${randomPart}`;
}

interface ViewRequisitionModalProps {
  open: boolean;
  onClose: () => void;
  requisition: Requisition;
  onUpdated?: () => void;
}

export default function ViewRequisitionModal({
  open,
  onClose,
  requisition,
  onUpdated,
}: ViewRequisitionModalProps) {
  const [items, setItems] = useState<
    { id: string; item_id: { id: string; name: string }; quantity: number }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && requisition) {
      fetchItems();
    } else {
      setItems([]);
    }
  }, [open, requisition]);

  async function fetchItems() {
    const { data, error } = await supabase
      .from("purchase_requisition_items")
      .select("id, quantity, item_id(id, name)")
      .eq("requisition_id", requisition.id);

    if (error) {
      alert("Failed to fetch requisition items: " + error.message);
      setItems([]);
      return;
    }
    setItems(data || []);
  }

  async function handleApprove() {
    setLoading(true);
    try {
      // 1. Update requisition status
      const { error: updateError } = await supabase
        .from("purchase_requisitions")
        .update({ status: "approved" })
        .eq("id", requisition.id);

      if (updateError) throw updateError;

      // 2. Generate PO number and create purchase order
      const poNumber = generatePONumber();
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert([
          {
            requisition_id: requisition.id,
            supplier_id: null,
            status: "pending",
            order_date: new Date().toISOString(),
            notes: null,
            po_number: poNumber,
          },
        ])
        .select()
        .single();

      if (poError) throw poError;

      // 3. Insert items to purchase_order_items
      const orderItems = items.map(({ item_id, quantity }) => ({
        purchase_order_id: poData.id,
        item_id: item_id.id,
        quantity,
        price: 0, // Set price later
      }));

      const { error: poiError } = await supabase
        .from("purchase_order_items")
        .insert(orderItems);

      if (poiError) throw poiError;

      if (onUpdated) onUpdated();
      onClose();
    } catch (error: any) {
      alert("Failed to approve requisition: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!requisition) return null;

  const status = (requisition.status ?? "").toString().trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Requisition Details</DialogTitle>
          <DialogDescription>
            View details for requisition{" "}
            <strong>{requisition.id.slice(0, 8)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <p>
              <strong>Requested By:</strong> {requisition.requested_by}
            </p>
            <p>
              <strong>Description:</strong> {requisition.description || "-"}
            </p>
            <p>
              <strong>Status:</strong> {requisition.status}
            </p>
            <p>
              <strong>Request Date:</strong>{" "}
              {format(new Date(requisition.request_date), "PPP")}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Items Requested</h3>
            <ul className="list-disc list-inside max-h-48 overflow-y-auto border rounded p-2 bg-muted">
              {items.length === 0 && <li>No items requested.</li>}
              {items.map((item) => (
                <li key={item.id}>
                  {item.item_id.name} - Quantity: {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} disabled={loading}>
            Close
          </Button>
          {status !== "approved" && (
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Approving..." : "Approve"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
