import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  TrendingDown, 
  AlertCircle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const InventoryAlerts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['inventory-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          items(name, sku, min_threshold, max_threshold),
          warehouses(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const { data: inventoryReport } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          items(name, sku, min_threshold, max_threshold, unit_price),
          warehouses(name)
        `);
      
      if (error) throw error;
      
      const lowStock = data?.filter(item => 
        item.quantity <= item.items?.min_threshold && item.quantity > 0
      ) || [];
      
      const outOfStock = data?.filter(item => 
        item.quantity === 0
      ) || [];
      
      const overstock = data?.filter(item => 
        item.quantity >= item.items?.max_threshold
      ) || [];

      return {
        lowStock,
        outOfStock,
        overstock,
        totalItems: data?.length || 0,
      };
    },
  });

  const handleAcknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('inventory_alerts')
      .update({ 
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Alert acknowledged successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'out_of_stock':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'overstock':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'expiring_soon':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <Badge variant="destructive">Low Stock</Badge>;
      case 'out_of_stock':
        return <Badge variant="destructive">Out of Stock</Badge>;
      case 'overstock':
        return <Badge variant="secondary">Overstock</Badge>;
      case 'expiring_soon':
        return <Badge variant="outline">Expiring Soon</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Alerts & Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeAlerts = alerts?.filter(alert => !alert.is_acknowledged) || [];
  const acknowledgedAlerts = alerts?.filter(alert => alert.is_acknowledged) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold text-orange-600">
                  {inventoryReport?.lowStock.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {inventoryReport?.outOfStock.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Overstock Items</p>
                <p className="text-2xl font-bold text-blue-600">
                  {inventoryReport?.overstock.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Active Alerts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {activeAlerts.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.alert_type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{alert.items?.name}</p>
                      <p className="text-sm text-muted-foreground">({alert.items?.sku})</p>
                      {getAlertBadge(alert.alert_type)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {alert.warehouses?.name}
                    </p>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              </div>
            ))}
            {activeAlerts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No active alerts. Your inventory levels are healthy!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {acknowledgedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Acknowledged Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {acknowledgedAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 border rounded-lg opacity-60">
                  {getAlertIcon(alert.alert_type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{alert.items?.name}</p>
                      <p className="text-sm text-muted-foreground">({alert.items?.sku})</p>
                      {getAlertBadge(alert.alert_type)}
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Acknowledged
                      </Badge>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      Acknowledged: {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};