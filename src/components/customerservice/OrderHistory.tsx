'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

type Order = {
  id: string;
  order_id: string;
  customer_id: string;
  product_id: string;
  demand_quantity: number;
  total_amount: number;
  payment_terms: string;
  order_date: string;
  delivery_status: string;
  assigned_staff: number | null;
  customers: {
    customer_id: string;
    customer_name: string;
    contact_info: string;
  } | null;
  items: {
    name: string;
    sku: string;
  } | null;
  employees: {
    first_name: string;
    last_name: string;
  } | null;
};

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customers (customer_id, customer_name, contact_info),
        items (name, sku),
        employees (first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to fetch order history');
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <p>Loading order history...</p>;
  if (orders.length === 0) return <p>No orders in history.</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer ID</TableHead>
            <TableHead>Customer Name</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Payment Terms</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Delivery Status</TableHead>
            <TableHead>Assigned Staff</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => (
            <TableRow key={o.id}>
              <TableCell>{o.order_id}</TableCell>
              <TableCell>{o.customers?.customer_id ?? 'N/A'}</TableCell>
              <TableCell>{o.customers?.customer_name ?? 'N/A'}</TableCell>
              <TableCell>{o.items?.name ?? 'N/A'}</TableCell>
              <TableCell>{o.demand_quantity}</TableCell>
              <TableCell>₱{Number(o.total_amount).toLocaleString()}</TableCell>
              <TableCell>{o.payment_terms}</TableCell>
              <TableCell>{format(new Date(o.order_date), 'MM/dd/yyyy')}</TableCell>
              <TableCell>{o.delivery_status}</TableCell>
              <TableCell>
                {o.employees
                  ? `${o.employees.first_name} ${o.employees.last_name}`
                  : 'Unassigned'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
