import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Search, Plus, MapPin, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddWarehouseDialog } from './AddWarehouseDialog';

export const WarehouseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any>(null); // for modal
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('warehouses')
        .select(`
          *,
          inventory(
            quantity,
            items(name, sku)
          )
        `)
        .eq('is_active', true);

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleDeleteWarehouse = async (warehouseId: string, warehouseName: string) => {
    if (!confirm(`Are you sure you want to delete "${warehouseName}"? This will affect all inventory records for this warehouse.`)) return;

    const { data: inventory } = await supabase
      .from('inventory')
      .select('id')
      .eq('warehouse_id', warehouseId)
      .gt('quantity', 0)
      .limit(1);

    if (inventory && inventory.length > 0) {
      toast({
        title: 'Cannot Delete',
        description: 'This warehouse still has inventory. Please transfer or remove all items before deleting.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('warehouses')
      .update({ is_active: false })
      .eq('id', warehouseId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete warehouse.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `${warehouseName} has been deleted.` });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
  };

  const getItemCount = (inventory: any[]) => {
    return inventory?.filter(item => item.quantity > 0).length || 0;
  };

  const getTotalStock = (inventory: any[]) => {
    return inventory?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  };

  const handleOpenEditModal = (warehouse: any) => {
    setEditingWarehouse(warehouse);
    setEditName(warehouse.name || '');
    setEditAddress(warehouse.address || '');
    setEditDescription(warehouse.description || '');
  };

  const handleUpdateWarehouse = async () => {
    if (!editName.trim()) {
      toast({ title: 'Error', description: 'Warehouse name cannot be empty', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('warehouses')
      .update({ name: editName, address: editAddress, description: editDescription })
      .eq('id', editingWarehouse.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update warehouse', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Warehouse updated successfully' });
      setEditingWarehouse(null);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
  };

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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Warehouse Management</CardTitle>
          <Button onClick={() => setShowAddWarehouse(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
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
                  <Button variant="outline" size="sm" onClick={() => handleOpenEditModal(warehouse)}>
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

<Dialog open={!!editingWarehouse} onOpenChange={() => setEditingWarehouse(null)}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Edit Warehouse</DialogTitle>
    </DialogHeader>
    <div className="space-y-3 mt-2">
      <Input
        placeholder="Warehouse Name"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
      />
      <Input
        placeholder="Address"
        value={editAddress}
        onChange={(e) => setEditAddress(e.target.value)}
      />
      <Input
        placeholder="Description"
        value={editDescription}
        onChange={(e) => setEditDescription(e.target.value)}
      />
      <Button className="w-full" onClick={handleUpdateWarehouse}>
        Save Changes
      </Button>
    </div>
  </DialogContent>
</Dialog>

      <AddWarehouseDialog open={showAddWarehouse} onOpenChange={setShowAddWarehouse} />
    </Card>
  );
};
