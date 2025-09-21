import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { ItemsTable } from '@/components/inventory/ItemsTable';
import { StockTransactions } from '@/components/inventory/StockTransactions';
import { WarehouseManagement } from '@/components/inventory/WarehouseManagement';
import { InventoryAlerts } from '@/components/inventory/InventoryAlerts';
import { AddItemDialog } from '@/components/inventory/AddItemDialog';

type InventoryItem = {
  quantity: number;
  items: {
    unit_price: number;
  };
};

export default function InventoryManagement() {
  const [showAddItem, setShowAddItem] = useState(false);

  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      // Low stock count
      const { count: lowStockCount } = await supabase
        .from('inventory_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('alert_type', 'low_stock')
        .eq('is_acknowledged', false);

      // Out of stock count
      const { count: outOfStockCount } = await supabase
        .from('inventory_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('alert_type', 'out_of_stock')
        .eq('is_acknowledged', false);

      // Total inventory value
      const { data: inventoryItems } = await supabase
        .from('inventory')
        .select(`
          quantity,
          items:items(unit_price)
        `) as { data: InventoryItem[] | null };

      const totalInventoryValue =
        inventoryItems?.reduce((sum, item) => {
          return sum + (item.quantity * (item.items?.unit_price || 0));
        }, 0) || 0;

      return {
        lowStock: lowStockCount || 0,
        outOfStock: outOfStockCount || 0,
        totalValue: totalInventoryValue,
      };
    },
  });

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory & Warehouse Management</h1>
            <p className="text-muted-foreground">Manage your inventory, track stock levels, and monitor warehouse operations</p>
          </div>
          <Button onClick={() => setShowAddItem(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{inventoryStats?.lowStock || 0}</div>
              <p className="text-xs text-muted-foreground">Items below minimum threshold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{inventoryStats?.outOfStock || 0}</div>
              <p className="text-xs text-muted-foreground">Items with zero quantity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${inventoryStats?.totalValue?.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">Based on unit prices</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="items" className="space-y-4">
          <TabsList>
            <TabsTrigger value="items">Items & Products</TabsTrigger>
            <TabsTrigger value="transactions">Stock Transactions</TabsTrigger>
            <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <ItemsTable />
          </TabsContent>

          <TabsContent value="transactions">
            <StockTransactions />
          </TabsContent>

          <TabsContent value="warehouses">
            <WarehouseManagement />
          </TabsContent>

          <TabsContent value="alerts">
            <InventoryAlerts />
          </TabsContent>
        </Tabs>

        <AddItemDialog open={showAddItem} onOpenChange={setShowAddItem} />
      </div>
    </ERPLayout>
  );
}
