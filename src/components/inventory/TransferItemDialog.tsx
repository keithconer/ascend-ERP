import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface TransferItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: { id: string; name: string }[];
  items: { id: string; name: string }[];
  onTransferComplete: () => void;
}

export function TransferItemDialog({
  open,
  onOpenChange,
  warehouses,
  items,
  onTransferComplete,
}: TransferItemDialogProps) {
  const { toast } = useToast();

  const [itemId, setItemId] = useState("");
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [quantity, setQuantity] = useState<string>(""); // use string for free typing
  const [warning, setWarning] = useState("");

  const handleTransfer = async () => {
    if (!itemId || !fromWarehouse || !toWarehouse || !quantity) {
      toast({ title: "Error", description: "Fill in all fields" });
      return;
    }
    if (fromWarehouse === toWarehouse) {
      toast({ title: "Error", description: "Cannot transfer to same warehouse" });
      return;
    }
    const qtyNumber = Number(quantity);
    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      toast({ title: "Error", description: "Quantity must be a positive number" });
      return;
    }

    // Insert a stock-out transaction for source warehouse
    const { error: outError } = await supabase.from("stock_transactions").insert([
      {
        transaction_type: "stock-out",
        item_id: itemId,
        warehouse_id: fromWarehouse,
        quantity: qtyNumber,
        unit_cost: 0,
        total_cost: 0,
        reference_number: `TRANSFER-${Date.now()}`,
        notes: `Transfer to warehouse ${toWarehouse}`,
      },
    ]);

    if (outError) {
      toast({ title: "Error", description: outError.message });
      return;
    }

    // Insert a stock-in transaction for destination warehouse
    const { error: inError } = await supabase.from("stock_transactions").insert([
      {
        transaction_type: "stock-in",
        item_id: itemId,
        warehouse_id: toWarehouse,
        quantity: qtyNumber,
        unit_cost: 0,
        total_cost: 0,
        reference_number: `TRANSFER-${Date.now()}`,
        notes: `Transfer from warehouse ${fromWarehouse}`,
      },
    ]);

    if (inError) {
      toast({ title: "Error", description: inError.message });
      return;
    }

    toast({ title: "Success", description: "Item transferred successfully" });
    onTransferComplete();
    onOpenChange(false);

    // Reset form
    setItemId("");
    setFromWarehouse("");
    setToWarehouse("");
    setQuantity("");
    setWarning("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Item</DialogTitle>
        </DialogHeader>

        {/* Select Item */}
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger>
            <SelectValue placeholder="Select item" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* From Warehouse */}
        <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
          <SelectTrigger>
            <SelectValue placeholder="From warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* To Warehouse */}
        <Select value={toWarehouse} onValueChange={setToWarehouse}>
          <SelectTrigger>
            <SelectValue placeholder="To warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Quantity */}
        <Input
          type="text"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => {
            const val = e.target.value;
            // allow only digits
            if (/^\d*$/.test(val)) {
              setQuantity(val);
              setWarning("");
            }
          }}
        />
        {warning && <p className="text-red-600 text-sm mt-1">{warning}</p>}

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransfer}>Transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
