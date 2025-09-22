import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

export const ItemsTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false); 
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Hide dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: items, isLoading } = useQuery({
    queryKey: ['items', appliedSearch],
    queryFn: async () => {
      let query: any = supabase
        .from<any, any>('items') // ✅ two type arguments
        .select(`
          *,
          categories(name),
          inventory(
            quantity,
            available_quantity,
            warehouses(name)
          )
        `)
        .eq('is_active', true);

      if (appliedSearch) {
        query = query.or(`name.ilike.%${appliedSearch}%,sku.ilike.%${appliedSearch}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm.trim()) {
        setSuggestions([]);
        setShowSuggestions(false); 
        return;
      }

      let { data, error } = await supabase
        .from<any, any>('items') // ✅ two type arguments
        .select('id, name, sku')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (!error && data) {
        setSuggestions(data);
        setShowSuggestions(true); 
      }
    };

    fetchSuggestions();
  }, [searchTerm]);

  const handleDeleteItem = async (itemId: string, itemName: string) => {
  if (!confirm(`Are you sure you want to permanently delete "${itemName}"? This action cannot be undone.`)) return;

  const { error } = await supabase
    .from<any, any>('items')
    .delete()
    .eq('id', itemId); // Hard delete

  if (error) {
    toast({ title: 'Error', description: 'Failed to delete item.', variant: 'destructive' });
  } else {
    toast({ title: 'Success', description: `"${itemName}" has been permanently deleted.` });
    queryClient.invalidateQueries({ queryKey: ['items'] });
  }
};


  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (value: string) => {
    setSearchTerm(value);
    setAppliedSearch(value);
    setSuggestions([]);
    setShowSuggestions(false); 
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(item.unit_price);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    const { error } = await supabase
      .from<any, any>('items') // ✅ two type arguments
      .update({ name: editName, unit_price: parseFloat(editPrice) || 0 })
      .eq('id', editingItem.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update item.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `"${editName}" has been updated.` });
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['items'] });
    }
  };

  const getTotalQuantity = (inventoryRecords: any[]) =>
    inventoryRecords?.reduce((sum, r) => sum + (r.quantity || 0), 0) || 0;

  const getAvailableQuantity = (inventoryRecords: any[]) =>
    inventoryRecords?.reduce((sum, r) => sum + (r.available_quantity || 0), 0) || 0;

  const getStockStatus = (item: any) => {
    const totalQty = getTotalQuantity(item.inventory);
    if (totalQty === 0) return { status: 'Out of Stock', variant: 'destructive' as const };
    if (totalQty <= item.min_threshold) return { status: 'Low Stock', variant: 'destructive' as const };
    if (totalQty >= item.max_threshold) return { status: 'Overstock', variant: 'secondary' as const };
    return { status: 'In Stock', variant: 'default' as const };
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
          <div className="flex items-center space-x-2 relative" ref={wrapperRef}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by name or SKU..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  if (value.trim() === '') {
                    setAppliedSearch('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 bg-white border rounded-md mt-1 w-full shadow">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => handleSuggestionClick(s.name)}
                    >
                      {s.name} <span className="text-xs text-gray-500">({s.sku})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={handleSearch}>Search</Button>
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
                {items?.map((item: any) => {
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
                      <TableCell>{getTotalQuantity(item.inventory)} {item.unit_of_measure}</TableCell>
                      <TableCell>{getAvailableQuantity(item.inventory)} {item.unit_of_measure}</TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
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
      </Card>

      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Item Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              placeholder="Unit Price"
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
