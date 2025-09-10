import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTransactionDialog = ({ open, onOpenChange }: AddTransactionDialogProps) => {
  const [formData, setFormData] = useState({
    item_id: '',
    warehouse_id: '',
    transaction_type: '',
    quantity: '',
    reference_number: '',
    notes: '',
    expiration_date: '',
    unit_cost: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items } = useQuery({
    queryKey: ['active-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, sku')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: warehouses } = useQuery({
    queryKey: ['active-warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const unitCost = parseFloat(formData.unit_cost) || 0;
      const quantity = parseInt(formData.quantity) || 0;
      const totalCost = unitCost * quantity;

      const { error } = await supabase.from('stock_transactions').insert({
        item_id: formData.item_id,
        warehouse_id: formData.warehouse_id,
        transaction_type: formData.transaction_type,
        quantity: quantity,
        reference_number: formData.reference_number || null,
        notes: formData.notes || null,
        expiration_date: formData.expiration_date || null,
        unit_cost: unitCost > 0 ? unitCost : null,
        total_cost: totalCost > 0 ? totalCost : null,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Transaction recorded successfully!',
      });

      // Reset form
      setFormData({
        item_id: '',
        warehouse_id: '',
        transaction_type: '',
        quantity: '',
        reference_number: '',
        notes: '',
        expiration_date: '',
        unit_cost: '',
      });

      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record transaction. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Stock Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item">Item *</Label>
              <Select
                value={formData.item_id}
                onValueChange={(value) => setFormData({ ...formData, item_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse">Warehouse *</Label>
              <Select
                value={formData.warehouse_id}
                onValueChange={(value) => setFormData({ ...formData, warehouse_id: value })}
                required
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_type">Transaction Type *</Label>
              <Select
                value={formData.transaction_type}
                onValueChange={(value) => setFormData({ ...formData, transaction_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock-in">Stock In</SelectItem>
                  <SelectItem value="stock-out">Stock Out</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference_number">Reference Number</Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="PO#, Invoice#, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_cost">Unit Cost ($)</Label>
              <Input
                id="unit_cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration_date">Expiration Date</Label>
            <Input
              id="expiration_date"
              type="date"
              value={formData.expiration_date}
              onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this transaction"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Transaction'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};