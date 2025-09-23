import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export const ItemsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUnitPrice, setEditUnitPrice] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('items')
        .select(`*, categories(name), inventory(quantity, available_quantity, warehouses(name))`)
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
      toast({ title: 'Error', description: 'Failed to delete item.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${itemName} has been deleted.` });
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

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditDescription(item.description || '');
    setEditUnitPrice(item.unit_price?.toString() || '');
  };

  const handleUpdateItem = async () => {
    if (!editName.trim()) {
      toast({ title: 'Error', description: 'Item name cannot be empty', variant: 'destructive' });
      return;
    }

    const price = parseFloat(editUnitPrice);
    if (isNaN(price) || price < 0) {
      toast({ title: 'Error', description: 'Invalid unit price', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('items')
      .update({ name: editName, description: editDescription, unit_price: price })
      .eq('id', editingItem.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Item updated successfully' });
      setEditingItem(null);
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
    <Card>
      <CardHeader>
        <CardTitle>Items & Products</CardTitle>
        <div className="flex items-center space-x-2 mt-2">
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
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{item.categories?.name || 'Uncategorized'}</TableCell>
                    <TableCell>${item.unit_price?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{getTotalQuantity(item.inventory)} {item.unit_of_measure}</TableCell>
                    <TableCell>{getAvailableQuantity(item.inventory)} {item.unit_of_measure}</TableCell>
                    <TableCell><Badge variant={stockStatus.variant}>{stockStatus.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteItem(item.id, item.name)}>
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
                    <p className="text-muted-foreground">No items found. Add your first item to get started.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Edit Item</DialogTitle>
    </DialogHeader>
    <div className="space-y-3 mt-2">
      <Input
        placeholder="Item Name"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
      />
      <Input
        placeholder="Description"
        value={editDescription}
        onChange={(e) => setEditDescription(e.target.value)}
      />
      <Input
        placeholder="Unit Price"
        type="text"
        value={editUnitPrice}
        onChange={(e) => setEditUnitPrice(e.target.value)}
      />
      <Button className="w-full" onClick={handleUpdateItem}>
        Save Changes
      </Button>
    </div>
  </DialogContent>
</Dialog>

    </Card>
  );
};
