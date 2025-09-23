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

export const ItemsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for edit modal and selected item
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  // Editable fields state
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editUnitPrice, setEditUnitPrice] = useState<number | ''>('');

  // Fetch categories for category dropdown
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

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select(`
          *,
          categories(id, name),
          inventory(
            quantity,
            available_quantity,
            warehouses(name)
          )
        `)
        .eq('is_active', true);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return;

    const { error } = await supabase
      .from('items')
      .update({ is_active: false })
      .eq('id', itemId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete item. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `${itemName} has been deleted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  };

  const getTotalQuantity = (inventoryRecords: any[]) => {
    return inventoryRecords?.reduce((sum, record) => sum + (record.quantity || 0), 0) || 0;
  };

  const getAvailableQuantity = (inventoryRecords: any[]) => {
    return inventoryRecords?.reduce((sum, record) => sum + (record.available_quantity || 0), 0) || 0;
  };

  const getStockStatus = (item: any) => {
    const totalQty = getTotalQuantity(item.inventory);
    if (totalQty === 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (totalQty <= item.min_threshold) return { status: 'Low Stock', variant: 'destructive' as const };
    if (totalQty >= item.max_threshold) return { status: 'Overstock', variant: 'secondary' as const };
    return { status: 'In Stock', variant: 'default' as const };
  };

  // Open edit modal and set fields
  const openEditModal = (item: any) => {
    setEditItem(item);
    setEditName(item.name || '');
    setEditCategoryId(item.categories?.id || null);
    setEditUnitPrice(item.unit_price ?? '');
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditItem(null);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      toast({ title: 'Validation Error', description: 'Name cannot be empty.', variant: 'destructive' });
      return;
    }
    if (editUnitPrice === '' || editUnitPrice < 0) {
      toast({ title: 'Validation Error', description: 'Unit Price must be a positive number.', variant: 'destructive' });
      return;
    }

    setIsEditOpen(false);

    const updates: any = {
      name: editName,
      unit_price: editUnitPrice,
      category_id: editCategoryId,
    };

    const { error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', editItem.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
      setIsEditOpen(true); // reopen modal on failure
    } else {
      toast({ title: 'Success', description: 'Item updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Items & Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading items...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Items & Products</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name or SKU..."
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
                      <TableCell>${item.unit_price?.toFixed(2) || '0.00'}</TableCell>
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
                      <p className="text-muted-foreground">
                        No items found. Add your first item to get started.
                      </p>
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
        <label htmlFor="edit-name" className="block font-semibold mb-1">
          Name
        </label>
        <Input
          id="edit-name"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder="Item name"
        />
      </div>

      <div>
        <label htmlFor="edit-category" className="block font-semibold mb-1">
          Category
        </label>
        <Select
          onValueChange={(value) => setEditCategoryId(value)}
          value={editCategoryId || ''}
        >
          <SelectTrigger id="edit-category" className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="edit-unit-price" className="block font-semibold mb-1">
          Unit Price
        </label>
        <Input
          id="edit-unit-price"
          type="number"
          min={0}
          step={0.01}
          value={editUnitPrice}
          onChange={(e) => {
            const val = e.target.value;
            setEditUnitPrice(val === '' ? '' : parseFloat(val));
          }}
          placeholder="Unit Price"
        />
      </div>
    </div>

    <DialogFooter className="mt-4 flex justify-end space-x-2">
      <Button variant="outline" onClick={closeEditModal}>
        Cancel
      </Button>
      <Button onClick={handleSaveEdit}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

    </>
  );
};
