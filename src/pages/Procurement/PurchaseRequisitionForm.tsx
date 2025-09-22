// src/pages/procurement/PurchaseRequisitionForm.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ItemOption {
  id: string;
  name: string;
}

interface FormItem {
  itemId: string;
  quantity: number;
}

interface PurchaseRequisitionFormProps {
  onSuccess?: () => void; // callback after successful save
}

export default function PurchaseRequisitionForm({ onSuccess }: PurchaseRequisitionFormProps) {
  const [requester, setRequester] = useState("");
  const [description, setDescription] = useState("");
  const [itemsOptions, setItemsOptions] = useState<ItemOption[]>([]);
  const [formItems, setFormItems] = useState<FormItem[]>([
    { itemId: "", quantity: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch available items to select
  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase.from("items").select("id, name").order("name");
    if (error) {
      toast({ title: "Error loading items", description: error.message });
    } else {
      setItemsOptions(data || []);
    }
  }

  // Handle change in item selection or quantity
  const updateFormItem = (index: number, field: keyof FormItem, value: any) => {
    const newItems = [...formItems];
    newItems[index][field] = value;
    setFormItems(newItems);
  };

  // Add new empty item row
  const addItemRow = () => {
    setFormItems([...formItems, { itemId: "", quantity: 1 }]);
  };

  // Remove an item row by index
  const removeItemRow = (index: number) => {
    if (formItems.length === 1) return; // keep at least one row
    const newItems = [...formItems];
    newItems.splice(index, 1);
    setFormItems(newItems);
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requester.trim()) {
      toast({ title: "Validation error", description: "Requester is required." });
      return;
    }

    if (formItems.some(item => !item.itemId)) {
      toast({ title: "Validation error", description: "Please select all items." });
      return;
    }

    setLoading(true);

    try {
      // Insert into purchase_requisitions
      const { data: reqData, error: reqError } = await supabase
        .from("purchase_requisitions")
        .insert([{ requested_by: requester, description, status: "pending", request_date: new Date().toISOString() }])
        .select()
        .single();

      if (reqError) throw reqError;
      if (!reqData) throw new Error("Failed to create requisition");

      // Insert related purchase_requisition_items with correct column name
      const itemsToInsert = formItems.map(({ itemId, quantity }) => ({
        requisition_id: reqData.id,
        item_id: itemId,
        quantity,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_requisition_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({ title: "Requisition created successfully" });
      // Clear form
      setRequester("");
      setDescription("");
      setFormItems([{ itemId: "", quantity: 1 }]);

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ title: "Error creating requisition", description: error.message });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 border rounded bg-white shadow-sm max-w-3xl">
      <div>
        <Label htmlFor="requester">Requested By</Label>
        <Input
          id="requester"
          type="text"
          placeholder="Enter requester name"
          value={requester}
          onChange={(e) => setRequester(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          type="text"
          placeholder="Description or notes"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <Label>Items</Label>
        {formItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <select
              className="border rounded px-2 py-1 flex-grow"
              value={item.itemId}
              onChange={(e) => updateFormItem(idx, "itemId", e.target.value)}
              required
            >
              <option value="">Select an item</option>
              {itemsOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="w-20 border rounded px-2 py-1"
              value={item.quantity}
              onChange={(e) => updateFormItem(idx, "quantity", Number(e.target.value))}
              required
            />
            <Button variant="destructive" size="sm" type="button" onClick={() => removeItemRow(idx)}>
              Remove
            </Button>
          </div>
        ))}
        <Button variant="outline" type="button" onClick={addItemRow}>
          + Add Item
        </Button>
      </div>

      <div>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Requisition"}
        </Button>
      </div>
    </form>
  );
}
