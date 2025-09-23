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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddItemDialog = ({ open, onOpenChange }: AddItemDialogProps) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    unit_price: '',
    unit_of_measure: 'pcs',
    min_threshold: '0',
    max_threshold: '1000',
    expiration_tracking: false,
    initial_quantity: '0', // NEW FIELD for quantity
    warehouse_id: '',       // NEW FIELD to select warehouse
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch warehouses for inventory location selection
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Insert the item first
      const { data: insertedItems, error: insertItemError } = await supabase
        .from('items')
        .insert({
          sku: formData.sku,
          name: formData.name,
          description: formData.description || null,
          category_id: formData.category_id || null,
          unit_price: parseFloat(formData.unit_price) || 0,
          unit_of_measure: formData.unit_of_measure,
          min_threshold: parseInt(formData.min_threshold) || 0,
          max_threshold: parseInt(formData.max_threshold) || 1000,
          expiration_tracking: formData.expiration_tracking,
        })
        .select('id'); // get inserted item's id

      if (insertItemError || !insertedItems || insertedItems.length === 0) {
        throw insertItemError || new Error('Failed to insert item');
      }

      const newItemId = insertedItems[0].id;

      // Insert initial inventory record if warehouse_id is selected and initial_quantity > 0
      if (formData.warehouse_id && parseInt(formData.initial_quantity) > 0) {
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert({
            item_id: newItemId,
            warehouse_id: formData.warehouse_id,
            quantity: parseInt(formData.initial_quantity),
            reserved_quantity: 0,
            // DO NOT include available_quantity, it is generated
          });

        if (inventoryError) {
          throw inventoryError;
        }
      }

      toast({
        title: 'Success',
        description: 'Item added successfully!',
      });

      // Reset form
      setFormData({
        sku: '',
        name: '',
        description: '',
        category_id: '',
        unit_price: '',
        unit_of_measure: 'pcs',
        min_threshold: '0',
        max_threshold: '1000',
        expiration_tracking: false,
        initial_quantity: '0',
        warehouse_id: '',
      });

      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Enter SKU"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter item name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_price">Unit Price ($)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unit</Label>
              <Select
                value={formData.unit_of_measure}
                onValueChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="lbs">Pounds</SelectItem>
                  <SelectItem value="liter">Liters</SelectItem>
                  <SelectItem value="box">Boxes</SelectItem>
                  <SelectItem value="ream">Reams</SelectItem>
                  <SelectItem value="license">Licenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_threshold">Min Threshold</Label>
              <Input
                id="min_threshold"
                type="number"
                min="0"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_threshold">Max Threshold</Label>
              <Input
                id="max_threshold"
                type="number"
                min="0"
                value={formData.max_threshold}
                onChange={(e) => setFormData({ ...formData, max_threshold: e.target.value })}
              />
            </div>
          </div>

          {/* New input for selecting warehouse */}
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

          {/* New input for initial quantity */}
          <div className="space-y-2">
            <Label htmlFor="initial_quantity">Initial Quantity *</Label>
            <Input
              id="initial_quantity"
              type="number"
              min="0"
              value={formData.initial_quantity}
              onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
              required
              placeholder="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="expiration_tracking"
              checked={formData.expiration_tracking}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, expiration_tracking: checked as boolean })
              }
            />
            <Label htmlFor="expiration_tracking">Enable expiration tracking</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
