// src/pages/procurement/PurchaseOrderForm.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"; // if you have a select component
import { useToast } from "@/hooks/use-toast";

interface RequisitionOption {
  id: string;
  po_number?: string; // or just id
  // maybe requested_by if you want to show
}

interface SupplierOption {
  id: string;
  name: string;
}

interface ItemOption {
  id: string;
  name: string;
}

interface FormItem {
  itemId: string;
  quantity: number;
  price: number;
}

interface PurchaseOrderFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function PurchaseOrderForm({ open, onClose, onCreated }: PurchaseOrderFormProps) {
  const [requisitions, setRequisitions] = useState<RequisitionOption[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [itemsOptions, setItemsOptions] = useState<ItemOption[]>([]);

  const [selectedRequisition, setSelectedRequisition] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [notes, setNotes] = useState<string>("");

  const [formItems, setFormItems] = useState<FormItem[]>([
    { itemId: "", quantity: 1, price: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchRequisitions();
      fetchSuppliers();
      fetchItems();
    }
  }, [open]);

  async function fetchRequisitions() {
    // fetch requisitions with status = "approved"
    const { data, error } = await supabase
      .from("purchase_requisitions")
      .select("id, requested_by")
      .eq("status", "approved")
      .order("request_date", { ascending: false });
    if (error) {
      toast({ title: "Error loading requisitions", description: error.message });
    } else {
      setRequisitions(data || []);
    }
  }

  async function fetchSuppliers() {
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name")
      .order("name");
    if (error) {
      toast({ title: "Error loading suppliers", description: error.message });
    } else {
      setSuppliers(data || []);
    }
  }

  async function fetchItems() {
    const { data, error } = await supabase
      .from("items")
      .select("id, name")
      .order("name");
    if (error) {
      toast({ title: "Error loading items", description: error.message });
    } else {
      setItemsOptions(data || []);
    }
  }

  const updateFormItem = (index: number, field: keyof FormItem, value: any) => {
    const newItems = [...formItems];
    newItems[index][field] = value;
    setFormItems(newItems);
  };

  const addItemRow = () => {
    setFormItems([...formItems, { itemId: "", quantity: 1, price: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (formItems.length === 1) return;
    const newItems = [...formItems];
    newItems.splice(index, 1);
    setFormItems(newItems);
  };

  function generatePoNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
    return `${year}${month}${day}-${random}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate
    if (!selectedSupplier) {
      toast({ title: "Validation error", description: "Supplier is required." });
      return;
    }

    if (formItems.some(fi => !fi.itemId || fi.quantity <= 0 || fi.price < 0)) {
      toast({ title: "Validation error", description: "Please ensure all items are filled correctly." });
      return;
    }

    setLoading(true);
    try {
      const po_number = generatePoNumber();

      // Insert PO
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert([
          {
            po_number,
            requisition_id: selectedRequisition,
            supplier_id: selectedSupplier,
            order_date: orderDate,
            status: "pending",
            notes,
          }
        ])
        .select()
        .single();

      if (poError || !poData) throw poError || new Error("Failed to create PO");

      // Insert PO items
      const itemsToInsert = formItems.map(fi => ({
        purchase_order_id: poData.id,
        item_id: fi.itemId,
        quantity: fi.quantity,
        price: fi.price,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({ title: "Purchase Order created", description: `PO ${po_number} created successfully` });
      onCreated();
      onClose();

    } catch (error: any) {
      toast({ title: "Error creating Purchase Order", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="p-4 bg-white rounded shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">New Purchase Order</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>From Requisition (optional)</Label>
          <Select
            value={selectedRequisition || ""}
            onValueChange={val => setSelectedRequisition(val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select requisition" />
            </SelectTrigger>
            <SelectContent>
              {requisitions.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  {r.id.slice(0,8)} — {r.requested_by}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Supplier</Label>
          <Select
            value={selectedSupplier || ""}
            onValueChange={val => setSelectedSupplier(val || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Order Date</Label>
          <Input
            type="date"
            value={orderDate}
            onChange={e => setOrderDate(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Notes (optional)</Label>
          <Input
            type="text"
            placeholder="Notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div>
          <Label>Items</Label>
          {formItems.map((fi, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Select
                value={fi.itemId || ""}
                onValueChange={val => updateFormItem(idx, "itemId", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {itemsOptions.map(it => (
                    <SelectItem key={it.id} value={it.id}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min={1}
                value={fi.quantity}
                onChange={e => updateFormItem(idx, "quantity", Number(e.target.value))}
                placeholder="Qty"
                required
                className="w-20"
              />

              <Input
                type="number"
                min={0}
                step="0.01"
                value={fi.price}
                onChange={e => updateFormItem(idx, "price", Number(e.target.value))}
                placeholder="Price"
                required
                className="w-24"
              />

              <Button variant="destructive" type="button" onClick={() => removeItemRow(idx)}>
                Remove
              </Button>
            </div>
          ))}

          <Button variant="outline" type="button" onClick={addItemRow}>
            + Add Item
          </Button>
        </div>

        <div className="pt-4 space-x-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Purchase Order"}
          </Button>
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
