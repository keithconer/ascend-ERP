// AddTransactionDialog.tsx
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionTypes: string[];
  onTransactionAdded: () => void;
}

export const AddTransactionDialog = ({
  open,
  onOpenChange,
  transactionTypes,
  onTransactionAdded,
}: AddTransactionDialogProps) => {
  const [transactionType, setTransactionType] = useState('stock-in');
  const [itemId, setItemId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState<string>(''); // string for free typing
  const [unitCost, setUnitCost] = useState<string>(''); // string for free typing
  const [reference, setReference] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  const [items, setItems] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  // Fetch items & warehouses
  useEffect(() => {
    const fetchData = async () => {
      const { data: itemsData } = await supabase.from('items').select('id, name');
      const { data: warehousesData } = await supabase.from('warehouses').select('id, name');
      if (itemsData) setItems(itemsData);
      if (warehousesData) setWarehouses(warehousesData);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    const qtyNumber = Number(quantity);
    const costNumber = Number(unitCost);

    if (!itemId || !warehouseId || qtyNumber <= 0 || costNumber < 0) {
      alert('Please fill all fields with valid numbers');
      return;
    }

    const totalCost = qtyNumber * costNumber;

    // Notes = Warehouse Name
    const warehouseName = warehouses.find((w) => w.id === warehouseId)?.name || '';
    const finalNotes = warehouseName;

    const { error } = await supabase.from('stock_transactions').insert([
      {
        transaction_type: transactionType,
        item_id: itemId,
        warehouse_id: warehouseId,
        quantity: qtyNumber,
        unit_cost: costNumber,
        total_cost: totalCost,
        reference_number: reference,
        notes: finalNotes,
        expiration_date: expirationDate || null,
      },
    ]);

    if (!error) {
      onTransactionAdded();
      onOpenChange(false);
      setTransactionType('stock-in');
      setItemId('');
      setWarehouseId('');
      setQuantity('');
      setUnitCost('');
      setReference('');
      setExpirationDate('');
    } else {
      console.error('Error adding transaction:', error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>

        {/* Transaction Type */}
        <label className="block mt-2 mb-1 font-medium">Transaction Type</label>
        <Select value={transactionType} onValueChange={setTransactionType}>
          <SelectTrigger>
            <SelectValue placeholder="Select transaction type" />
          </SelectTrigger>
          <SelectContent>
            {transactionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Item */}
        <label className="block mt-2 mb-1 font-medium">Item</label>
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

        {/* Warehouse */}
        <label className="block mt-2 mb-1 font-medium">Warehouse</label>
        <Select value={warehouseId} onValueChange={setWarehouseId}>
          <SelectTrigger>
            <SelectValue placeholder="Select warehouse" />
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
            if (/^\d*$/.test(val)) setQuantity(val); // only digits
          }}
        />

        {/* Cost */}
        <Input
          type="text"
          placeholder="Unit Cost"
          value={unitCost}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d*\.?\d*$/.test(val)) setUnitCost(val); // digits + optional dot
          }}
        />

        {/* Expiration Date */}
        <label className="block mt-2 mb-1 font-medium">Expiration Date</label>
        <Input
          type="date"
          value={expirationDate}
          onChange={(e) => setExpirationDate(e.target.value)}
        />

        {/* Reference */}
        <label className="block mt-2 mb-1 font-medium">Reference Number</label>
        <Input
          placeholder="Reference Number"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <Button onClick={handleSave} className="mt-4 w-full">
          Save Transaction
        </Button>
      </DialogContent>
    </Dialog>
  );
};
