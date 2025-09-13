import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { orderSyncService } from '@/pages/ecommerce/services/orderSync.service';
import { EcommerceOrder, OrderStatus, SyncStatus } from '@/pages/ecommerce/types';
import { formatDistance } from 'date-fns';
import { cn } from '@/lib/utils';

const OrderSynchronization: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<EcommerceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeSync = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await orderSyncService.subscribeToOrders((updatedOrders) => {
          if (isMounted) {
            setOrders(updatedOrders);
            setIsLoading(false);
          }
        });

        toast({
          description: "Successfully connected to order sync",
        });
      } catch (err) {
        if (isMounted) {
          setError('Failed to initialize order synchronization');
          setIsLoading(false);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to subscribe to order updates",
          });
        }
      }
    };

    initializeSync();

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      orderSyncService.unsubscribe();
    };
  }, [toast]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Order Synchronization</h2>
        <Badge variant="outline" className="ml-2">
          Real-time Sync Active
        </Badge>
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
                      <Badge variant={order.sync_status === SyncStatus.SYNCED ? "default" :
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
