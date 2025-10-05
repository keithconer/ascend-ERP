'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

// Helper function to format Peso
const formatPeso = (value: number | string) => {
  if (typeof value === 'string') value = parseFloat(value);
  return `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

export const ItemsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editUnitPrice, setEditUnitPrice] = useState<number | ''>(''); 
  const [editAvailableQuantity, setEditAvailableQuantity] = useState<number | ''>(''); 

  // Debounce search term to prevent character-by-character fetch
  useEffect(() => {
    const delay = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch items with search filter
  const { data: items, isLoading } = useQuery({
    queryKey: ['items', debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select(`
          *,
          categories(id, name),
          inventory(
            id,
            quantity,
            reserved_quantity,
            available_quantity,
            warehouse_id,
            warehouses(name)
          )
        `)
        .eq('is_active', true);

      if (debouncedSearch) {
        query = query.ilike('name', `%${debouncedSearch}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Handle item deletion
  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${itemName}"? This action cannot be undone.`)) return;

    const { error: inventoryError } = await supabase
      .from('inventory')
      .delete()
      .eq('item_id', itemId);

    if (inventoryError) {
      toast({
        title: 'Error',
        description: `Failed to delete inventory related to "${itemName}".`,
        variant: 'destructive',
      });
      return;
    }

    const { error: itemError } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId);

    if (itemError) {
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: `"${itemName}" has been permanently deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  };

  // Get total quantity from inventory
  const getTotalQuantity = (inventory: any[]) =>
    inventory?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0;

  // Get available quantity from inventory
  const getAvailableQuantity = (inventory: any[]) =>
    inventory?.reduce((sum, r) => sum + (r.available_quantity || 0), 0) || 0;

  // Get stock status based on inventory levels
  const getStockStatus = (item: any) => {
    const total = getTotalQuantity(item.inventory);
    if (total === 0) return { status: 'Out of Stock', variant: 'destructive' };
    if (total <= item.min_threshold) return { status: 'Low Stock', variant: 'destructive' };
    if (total >= item.max_threshold) return { status: 'Overstock', variant: 'secondary' };
    return { status: 'In Stock', variant: 'default' };
  };

  // Open the edit modal
  const openEditModal = (item: any) => {
    setEditItem(item);
    setEditName(item.name || '');
    setEditCategoryId(item.categories?.id || null);
    setEditUnitPrice(item.unit_price ?? '');
    setEditAvailableQuantity(getAvailableQuantity(item.inventory));
    setIsEditOpen(true);
  };

  // Close the edit modal
  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditItem(null);
    setEditAvailableQuantity('');
  };

  // Save the edited item
  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast({ title: 'Validation Error', description: 'Name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (editUnitPrice === '' || editUnitPrice < 0) {
      toast({ title: 'Validation Error', description: 'Unit Price must be positive.', variant: 'destructive' });
      return;
    }
    if (editAvailableQuantity === '' || editAvailableQuantity < 0) {
      toast({ title: 'Validation Error', description: 'Available Quantity must be non-negative.', variant: 'destructive' });
      return;
    }

    setIsEditOpen(false);

    const updates: any = {
      name: editName,
      unit_price: editUnitPrice,
      category_id: editCategoryId,
    };

    const { error: itemError } = await supabase
      .from('items')
      .update(updates)
      .eq('id', editItem.id);

    if (itemError) {
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
      setIsEditOpen(true);
      return;
    }

    const inventoryRecord = editItem.inventory[0];
    const newQuantity = editAvailableQuantity + (inventoryRecord.reserved_quantity || 0);

    const { error: invError } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity })
      .eq('id', inventoryRecord.id);

    if (invError) {
      toast({ title: 'Error', description: 'Failed to update inventory quantity.', variant: 'destructive' });
      setIsEditOpen(true);
      return;
    }

    toast({ title: 'Success', description: 'Item and inventory updated.' });
    queryClient.invalidateQueries({ queryKey: ['items'] });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Items & Products</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Qty</TableHead>
                  <TableHead>Available Qty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.sku}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{item.categories?.name || 'Uncategorized'}</TableCell>
                      <TableCell>{formatPeso(item.unit_price)}</TableCell>
                      <TableCell>
                        {getTotalQuantity(item.inventory)} {item.unit_of_measure}
                      </TableCell>
                      <TableCell>
                        {getAvailableQuantity(item.inventory)} {item.unit_of_measure}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!items || items.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">No items found.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={closeEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>Update item details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label htmlFor="edit-name" className="block font-semibold mb-1">Name</label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Item name"
              />
            </div>
            <div>
              <label htmlFor="edit-category" className="block font-semibold mb-1">Category</label>
              <Select onValueChange={(val) => setEditCategoryId(val)} value={editCategoryId || ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="edit-unit-price" className="block font-semibold mb-1">Unit Price</label>
              <Input
                id="edit-unit-price"
                type="number"
                min={0}
                step={0.01}
                value={editUnitPrice}
                onChange={(e) => setEditUnitPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="Unit Price"
              />
            </div>
            <div>
              <label htmlFor="edit-available-quantity" className="block font-semibold mb-1">
                Available Quantity
              </label>
              <Input
                id="edit-available-quantity"
                type="number"
                min={0}
                step={1}
                value={editAvailableQuantity}
                onChange={(e) =>
                  setEditAvailableQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                placeholder="Available Quantity"
              />
            </div>
          </div>
          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
