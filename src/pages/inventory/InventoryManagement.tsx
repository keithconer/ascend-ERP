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
import { InventorySummary } from '@/components/inventory/InventorySummary';

// Helper function to format currency in Peso (₱)
const formatCurrency = (value: number | string) => {
  if (typeof value === 'string') value = parseFloat(value);
  return `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

export default function InventoryManagement() {
  const [showAddItem, setShowAddItem] = useState(false);

  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          available_quantity,
          quantity,
          items (
            id,
            name,
            unit_price,
            min_threshold
          )
        `);

      if (error) {
        console.error('Failed to fetch inventory stats:', error);
        throw error;
      }

      let lowStock = 0;
      let outOfStock = 0;
      let criticalStock = 0;
      let totalValue = 0;

      for (const record of data || []) {
        const availableQty = record.available_quantity ?? 0;
        const quantity = record.quantity ?? 0;
        const unitPrice = record.items?.unit_price ?? 0;
        const minThreshold = record.items?.min_threshold ?? null;

        totalValue += quantity * unitPrice;

        if (availableQty < 0) {
          criticalStock++;
          outOfStock++; // count as out of stock too
          continue;
        }

        if (availableQty === 0) {
          outOfStock++;
          continue;
        }

        if (minThreshold !== null && availableQty <= minThreshold) {
          lowStock++;
        }
      }

      return {
        lowStock,
        outOfStock,
        criticalStock,
        totalValue,
      };
    },
  });

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory & Warehouse Management</h1>
            <p className="text-muted-foreground">
              Manage your inventory, track stock levels, and monitor warehouse operations
            </p>
          </div>
          <Button onClick={() => setShowAddItem(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inventoryStats?.lowStock || 0}</div>
              <p className="text-xs text-muted-foreground">Below minimum threshold</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{inventoryStats?.outOfStock || 0}</div>
              <p className="text-xs text-muted-foreground">Zero or negative quantity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inventoryStats?.criticalStock || 0}</div>
              <p className="text-xs text-muted-foreground">Negative stock levels</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(inventoryStats?.totalValue || 0)}</div>
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
            <TabsTrigger value="inventorysummary">Inventory Summary</TabsTrigger>
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

          <TabsContent value="inventorysummary">
            <InventorySummary />
          </TabsContent>
        </Tabs>

        <AddItemDialog open={showAddItem} onOpenChange={setShowAddItem} />
      </div>
    </ERPLayout>
  );
}
