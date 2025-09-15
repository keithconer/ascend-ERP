import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EcommerceOrder, OrderStatus, SyncStatus } from '../types';
import { formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';

const OrderSynchronization: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('ecommerce_orders')
          .select(`
            id,
            external_order_id,
            customer_name,
            order_status,
            total_amount,
            currency,
            shipping_address,
            sync_status,
            created_at,
            updated_at
          `);
        
        if (error) {
          console.error('Error fetching orders:', error);
          setError('Failed to fetch orders');
          return;
        }
        
        console.log('Fetched orders:', data);
        const mappedOrders = data?.map(order => ({
          id: order.id,
          external_order_id: order.external_order_id || '',
          customer_name: order.customer_name,
          order_status: order.order_status as OrderStatus,
          total_amount: Number(order.total_amount),
          currency: order.currency || 'USD',
          items: [],
          shipping_address: null,
          sync_status: order.sync_status as SyncStatus,
          created_at: order.created_at,
          updated_at: order.updated_at
        })) || [];
        setOrders(mappedOrders);

      } catch (err) {
        console.error('Error:', err);
        setError('Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchOrders();

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel('ecommerce_orders')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ecommerce_orders' 
        },
        () => {
          // Refetch orders when any change occurs
          fetchOrders();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Order Synchronization</h2>
      </div>

      <Card>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Sync Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-[200px]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm text-muted-foreground">Connecting to order sync...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-[200px]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="text-sm text-destructive">{error}</p>
                      <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-primary hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-[200px]">
                    <p className="text-sm text-muted-foreground">No orders found</p>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.external_order_id}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant={order.order_status === OrderStatus.DELIVERED ? "default" : 
                                   order.order_status === OrderStatus.CANCELLED ? "destructive" : 
                                   "secondary"}>
                        {order.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: order.currency
                      }).format(order.total_amount)}
                    </TableCell>
                    <TableCell>
                      {formatDistance(new Date(order.created_at), new Date(), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.sync_status === SyncStatus.SYNCED ? "success" :
                                   order.sync_status === SyncStatus.FAILED ? "destructive" :
                                   "secondary"}>
                        {order.sync_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      {/* Connection Status */}
      <div className="flex justify-end items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          error ? "bg-destructive" : 
          isLoading ? "bg-secondary animate-pulse" : 
          "bg-green-500"
        )} />
        <Badge 
          variant={error ? "destructive" : isLoading ? "secondary" : "success"} 
          className="ml-2"
        >
          {error ? "Connection Error" : isLoading ? "Connecting..." : "Real-time Sync Active"}
        </Badge>
      </div>
    </div>
  );
};

export default OrderSynchronization;
