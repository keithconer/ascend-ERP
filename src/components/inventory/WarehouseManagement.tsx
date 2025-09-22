import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search, Plus, MapPin, Layers3, ArrowLeftRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AddWarehouseDialog } from './AddWarehouseDialog';
import { TransferItemDialog } from './TransferItemDialog'; 
import { ZoneManagementDialog } from './ZoneManagementDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const WarehouseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [showAddWarehouse, setShowAddWarehouse] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<any | null>(null);
  const [transferWarehouse, setTransferWarehouse] = useState<any | null>(null);
  const [zonesWarehouse, setZonesWarehouse] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === '') setAppliedSearch('');
  }, [searchTerm]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses', appliedSearch],
    queryFn: async () => {
      let query = supabase
        .from('warehouses')
        .select(`
          id,
          name,
          address,
          description,
          created_at,
          inventory(
            id,
            quantity,
            zone_id,
            items(name, sku)
          ),
          zones(id, name)
        `);

      if (appliedSearch) query = query.ilike('name', `%${appliedSearch}%`);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('items').select('id, name, sku');
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

  const handleDeleteWarehouse = async (warehouseId: string, warehouseName: string) => {
    if (!confirm(`Delete "${warehouseName}"? This removes all zones and inventory.`)) return;

    const { data: inventory, error: invErr } = await supabase
      .from('inventory')
      .select('id')
      .eq('warehouse_id', warehouseId)
      .gt('quantity', 0)
      .limit(1);

    if (invErr) {
      toast({ title: 'Error', description: 'Failed to check inventory.', variant: 'destructive' });
      return;
    }

    if (inventory && inventory.length > 0) {
      toast({ title: 'Cannot Delete', description: 'This warehouse still has stock.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('warehouses').delete().eq('id', warehouseId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete warehouse.', variant: 'destructive' });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    toast({ title: 'Success', description: `"${warehouseName}" deleted.` });
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
        description: editDescription,
      })
      .eq('id', editingWarehouse.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update warehouse.', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `"${editName}" updated.` });
      setEditingWarehouse(null);
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
  };

  const getItemCount = (inventory: any[]) => inventory?.filter(i => i.quantity > 0).length || 0;
  const getTotalStock = (inventory: any[]) => inventory?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>Warehouse Management</CardTitle></CardHeader>
        <CardContent><div className="flex items-center justify-center h-32"><p>Loading...</p></div></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Warehouse Management</CardTitle>
            <div className="flex space-x-2">
              <Button onClick={() => setShowAddWarehouse(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Warehouse
              </Button>
              <Button onClick={() => setTransferOpen(true)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" /> Transfer Item
              </Button>
            </div>
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
                  {isFetchingSuggestions && <div className="px-3 py-2 text-sm">Loading...</div>}
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSuggestionClick(s.name);
                      }}
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
          {/* ✅ Warehouses table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses?.map((wh: any) => (
                <TableRow key={wh.id}>
                  <TableCell>{wh.name}</TableCell>
                  <TableCell>{wh.address || '-'}</TableCell>
                  <TableCell>{wh.description || '-'}</TableCell>
                  <TableCell>{getItemCount(wh.inventory)}</TableCell>
                  <TableCell>{getTotalStock(wh.inventory)}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditClick(wh)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteWarehouse(wh.id, wh.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>

        <AddWarehouseDialog open={showAddWarehouse} onOpenChange={setShowAddWarehouse} />
      </Card>

      <Dialog open={!!editingWarehouse} onOpenChange={() => setEditingWarehouse(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Warehouse</DialogTitle></DialogHeader>
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

      {zonesWarehouse && (
        <ZoneManagementDialog warehouse={zonesWarehouse} onClose={() => setZonesWarehouse(null)} />
      )}

      <TransferItemDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        warehouses={warehouses}
        items={items}
        onTransferComplete={() =>
          queryClient.invalidateQueries({ queryKey: ['stock-transactions'] })
        }
      />
    </>
  );
};
