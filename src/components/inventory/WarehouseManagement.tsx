import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search, Plus, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddWarehouseDialog } from './AddWarehouseDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

export const WarehouseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Reset applied search when searchTerm is cleared
  useEffect(() => {
    if (searchTerm.trim() === '') setAppliedSearch('');
  }, [searchTerm]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced suggestions while typing
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSuggestions([]);
        return;
      }
      setIsFetchingSuggestions(true);

      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);

      if (!error && data) setSuggestions(data);
      else setSuggestions([]);

      setIsFetchingSuggestions(false);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch warehouses with inventory
  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses', appliedSearch],
    queryFn: async () => {
      let query = supabase
        .from('warehouses')
        .select(`*, inventory(quantity, items(name, sku))`);

      if (appliedSearch) query = query.ilike('name', `%${appliedSearch}%`);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSearch = () => {
    setAppliedSearch(searchTerm);
    setSuggestions([]);
  };

  const handleSuggestionClick = (value: string) => {
    setSearchTerm(value);
    setAppliedSearch(value);
    setSuggestions([]);
  };

  // ✅ Hard delete warehouse
  const handleDeleteWarehouse = async (warehouseId: string, warehouseName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${warehouseName}"? This will remove all inventory records for this warehouse.`)) return;

    // Check if warehouse has inventory
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('id')
      .eq('warehouse_id', warehouseId)
      .gt('quantity', 0)
      .limit(1);

    if (inventoryError) {
      toast({ title: 'Error', description: 'Failed to check inventory.', variant: 'destructive' });
      return;
    }

    if (inventory && inventory.length > 0) {
      toast({
        title: 'Cannot Delete',
        description: 'This warehouse still has inventory. Please transfer or remove all items before deleting.',
        variant: 'destructive',
      });
      return;
    }

    // Hard delete warehouse
    const { error } = await supabase
      .from('warehouses')
      .delete()
      .eq('id', warehouseId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete warehouse.', variant: 'destructive' });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    toast({ title: 'Success', description: `"${warehouseName}" has been deleted permanently.` });
  };

  const handleEditClick = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setEditName(warehouse.name);
    setEditAddress(warehouse.address || '');
    setEditDescription(warehouse.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingWarehouse) return;

    const { error } = await supabase
      .from('warehouses')
      .update({
        name: editName,
        address: editAddress,
        description: editDescription
      })
      .eq('id', editingWarehouse.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update warehouse.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `"${editName}" has been updated.` });
      setEditingWarehouse(null);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
  };

  const getItemCount = (inventory: any[]) => inventory?.filter(item => item.quantity > 0).length || 0;
  const getTotalStock = (inventory: any[]) => inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading warehouses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Warehouse Management</CardTitle>
            <Button onClick={() => setShowAddWarehouse(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </div>
          <div className="flex items-center space-x-2 relative" ref={wrapperRef}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search warehouses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 bg-white border rounded-md mt-1 w-full shadow-md">
                  {isFetchingSuggestions && <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>}
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s.name); }}
                    >
                      {s.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={handleSearch}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses?.map((warehouse) => (
              <Card key={warehouse.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  {warehouse.address && <p className="text-sm text-muted-foreground">{warehouse.address}</p>}
                  {warehouse.description && <p className="text-sm text-muted-foreground">{warehouse.description}</p>}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Unique Items:</span>
                      <span className="font-medium">{getItemCount(warehouse.inventory)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Stock:</span>
                      <span className="font-medium">{getTotalStock(warehouse.inventory)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created:</span>
                      <span className="text-sm">{new Date(warehouse.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(warehouse)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteWarehouse(warehouse.id, warehouse.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!warehouses || warehouses.length === 0) && (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No warehouses found. Add your first warehouse to get started.</p>
              </div>
            )}
          </div>
        </CardContent>

        <AddWarehouseDialog
          open={showAddWarehouse}
          onOpenChange={setShowAddWarehouse}
        />
      </Card>

      {/* Edit Warehouse Dialog */}
      <Dialog open={!!editingWarehouse} onOpenChange={() => setEditingWarehouse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Input placeholder="Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            <Input placeholder="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingWarehouse(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
