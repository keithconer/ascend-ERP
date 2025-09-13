import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { orderSyncService } from '@/pages/ecommerce/services/orderSync.service';
import { ShoppingCart, Package, CheckCircle, AlertTriangle } from 'lucide-react';
import { EcommerceOrder, OrderStatus } from '../types';

export const Overview = () => {
  const { data: orders, refetch } = useQuery<EcommerceOrder[]>({
    queryKey: ['ecommerce-orders'],
    queryFn: () => orderSyncService.fetchOrders(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  useEffect(() => {
    // Set up real-time subscription
    orderSyncService.subscribeToOrders((updatedOrders) => {
      console.log('Received updated orders:', updatedOrders);
      refetch(); // Refetch when we get updates
    });

    // Cleanup subscription on unmount
    return () => {
      orderSyncService.unsubscribe();
    };
  }, [refetch]);

  console.log('Current orders data:', orders);

  // Calculate statistics
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => {
      console.log('Checking order status:', o.id, o.order_status);
      return o.order_status.toLowerCase() === OrderStatus.PENDING.toLowerCase();
    }).length || 0,
    processing: orders?.filter(o => 
      o.order_status.toLowerCase() === OrderStatus.PROCESSING.toLowerCase()
    ).length || 0,
    completed: orders?.filter(o => 
      o.order_status.toLowerCase() === OrderStatus.DELIVERED.toLowerCase()
    ).length || 0,
  };
  
  console.log('Calculated stats:', stats);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Orders tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
