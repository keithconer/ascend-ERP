import { supabase } from '@/integrations/supabase/client';
import { EcommerceOrder, OrderStatus, SyncStatus } from '../types';
import { toast } from '@/components/ui/use-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export class OrderSyncService {
  private subscription: RealtimeChannel | null = null;

  async subscribeToOrders(callback: (orders: EcommerceOrder[]) => void) {
    try {
      console.log('Initializing order sync subscription...');
      
      // Unsubscribe from any existing subscription
      if (this.subscription) {
        await supabase.removeChannel(this.subscription);
        this.subscription = null;
      }

      // Initial fetch
      const orders = await this.fetchOrders();
      callback(orders);

      // Subscribe to real-time changes
      this.subscription = supabase
        .channel('ecommerce_orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ecommerce_orders'
          },
          async (payload: RealtimePostgresChangesPayload<any>) => {
            console.log('Received real-time update:', payload);
            
            // Show appropriate toast notification based on event type
            if (payload.eventType === 'INSERT') {
              toast({
                title: 'New Order',
                description: `Order #${payload.new.id} has been received`,
              });
            } else if (payload.eventType === 'UPDATE') {
              toast({
                title: 'Order Updated',
                description: `Order #${payload.new.id} has been updated`,
              });
            }

            // Fetch updated orders with items
            const updatedOrders = await this.fetchOrders();
            callback(updatedOrders);
          }
        )
        .subscribe((status) => {
          console.log('Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            toast({
              title: "Connected",
              description: "Successfully connected to order sync",
            });
          } else {
            console.log('Subscription status changed:', status);
          }
        });

    } catch (error) {
      console.error('Error in order sync subscription:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to order sync",
      });
      throw error;
    }
  }

  async fetchOrders(): Promise<EcommerceOrder[]> {
    console.log('Fetching orders - START');
    try {
      // Try a simple query first to debug
      const testQuery = await supabase
        .from('ecommerce_orders')
        .select('*');
      
      console.log('DEBUG - Raw orders data:', testQuery.data);
      console.log('DEBUG - Query error:', testQuery.error);

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
          updated_at,
          items:ecommerce_order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch orders: " + error.message,
        });
        throw error;
      }

      if (!data) {
        console.warn('No orders data received');
        return [];
      }

      console.log('Fetched orders:', data.length, 'orders');
      return data?.map(row => ({
        id: row.id,
        external_order_id: row.external_order_id || '',
        customer_name: row.customer_name,
        order_status: row.order_status as OrderStatus,
        total_amount: Number(row.total_amount),
        currency: row.currency,
        items: this.parseJsonField(row.items) || [],
        shipping_address: this.parseJsonField(row.shipping_address),
        sync_status: row.sync_status as SyncStatus,
        created_at: row.created_at,
        updated_at: row.updated_at
      })) || [];
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch orders: " + (err as Error).message,
      });
      throw err;
    }
  }

  private parseJsonField(field: any) {
    if (!field) return null;
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch {
        return null;
      }
    }
    return field;
  }

  unsubscribe() {
    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
  }
}

export const orderSyncService = new OrderSyncService();
