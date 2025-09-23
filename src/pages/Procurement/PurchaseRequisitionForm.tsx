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

interface SupplierOption {
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
  const [supplierId, setSupplierId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [itemsOptions, setItemsOptions] = useState<ItemOption[]>([]);
  const [suppliersOptions, setSuppliersOptions] = useState<SupplierOption[]>([]);
  const [formItems, setFormItems] = useState<FormItem[]>([{ itemId: "", quantity: 1 }]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch items and suppliers on mount
  useEffect(() => {
    fetchItems();
    fetchSuppliers();
  }, []);

  async function fetchItems() {
    const { data, error } = await supabase.from("items").select("id, name").order("name");
    if (error) {
      toast({ title: "Error loading items", description: error.message });
    } else {
      setItemsOptions(data || []);
    }
  }

  async function fetchSuppliers() {
    const { data, error } = await supabase.from("suppliers").select("id, name").order("name");
    if (error) {
      toast({ title: "Error loading suppliers", description: error.message });
    } else {
      setSuppliersOptions(data || []);
    }
  }

  // Update specific form item field
  const updateFormItem = (index: number, field: keyof FormItem, value: string | number) => {
    setFormItems((current) => {
      const newItems = [...current];
      newItems[index] = { ...newItems[index], [field]: value };
      return newItems;
    });
  };

  // Add empty item row
  const addItemRow = () => {
    setFormItems((current) => [...current, { itemId: "", quantity: 1 }]);
  };

  // Remove item row by index (keep at least one)
  const removeItemRow = (index: number) => {
    setFormItems((current) => {
      if (current.length === 1) return current;
      const newItems = [...current];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId.trim()) {
      toast({ title: "Validation error", description: "Supplier is required." });
      return;
    }

    if (formItems.some((item) => !item.itemId)) {
      toast({ title: "Validation error", description: "Please select all items." });
      return;
    }

    setLoading(true);

    try {
      // Insert new purchase requisition with supplier_id
      const { data: reqData, error: reqError } = await supabase
        .from("purchase_requisitions")
        .insert([
          {
            supplier_id: supplierId,
            description,
            status: "pending",
            request_date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (reqError) throw reqError;
      if (!reqData) throw new Error("Failed to create requisition");

      // Insert items related to the requisition
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

      // Reset form
      setSupplierId("");
      setDescription("");
      setFormItems([{ itemId: "", quantity: 1 }]);

      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({ title: "Error creating requisition", description: error.message });
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-4 border rounded bg-white shadow-sm max-w-3xl"
    >
      <div>
        <Label htmlFor="supplier">Supplier</Label>
        <select
          id="supplier"
          className="w-full border rounded px-3 py-2"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          required
        >
          <option value="">Select a supplier</option>
          {suppliersOptions.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
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
              onChange={(e) => {
                const val = Number(e.target.value);
                updateFormItem(idx, "quantity", val < 1 ? 1 : val);
              }}
              required
            />
            <Button
              variant="destructive"
              size="sm"
              type="button"
              onClick={() => removeItemRow(idx)}
            >
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
