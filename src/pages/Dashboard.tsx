import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, Warehouse } from 'lucide-react';
import { ERPLayout } from '@/components/erp/ERPLayout';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [itemsCount, warehousesCount, alertsCount, transactionsCount] = await Promise.all([
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('warehouses').select('*', { count: 'exact', head: true }),
        supabase.from('inventory_alerts').select('*', { count: 'exact', head: true }).eq('is_acknowledged', false),
        supabase.from('stock_transactions').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalItems: itemsCount.count || 0,
        totalWarehouses: warehousesCount.count || 0,
        activeAlerts: alertsCount.count || 0,
        totalTransactions: transactionsCount.count || 0,
      };
    },
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stock_transactions')
        .select(`
          *,
          items(name, sku),
          warehouses(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      return data || [];
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ['active-alerts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          items(name, sku),
          warehouses(name)
        `)
        .eq('is_acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(5);
      
      return data || [];
    },
  });

  return (
    <ERPLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to ERP Ascend - Your Complete Business Management Solution</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground">Inventory items tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalWarehouses || 0}</div>
              <p className="text-xs text-muted-foreground">Active locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeAlerts || 0}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
              <p className="text-xs text-muted-foreground">Stock movements</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions?.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{transaction.items?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.warehouses?.name} • {transaction.transaction_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{transaction.quantity}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!recentTransactions || recentTransactions.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts?.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{alert.items?.name}</p>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!alerts || alerts.length === 0) && (
                  <p className="text-muted-foreground text-center py-4">No active alerts</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ERPLayout>
  );
}