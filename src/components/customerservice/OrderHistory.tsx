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
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase();
    const customerName = order.customers?.customer_name?.toLowerCase() || '';
    const customerId = order.customers?.customer_id?.toLowerCase() || '';
    const orderId = order.order_id?.toLowerCase() || '';

    return (
      customerName.includes(search) ||
      customerId.includes(search) ||
      orderId.includes(search)
    );
  });

  if (loading) return <p>Loading order history...</p>;
  if (orders.length === 0) return <p>No orders in history.</p>;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Customer Name, Customer ID, or Order ID..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
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
            {filteredOrders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>{o.order_id}</TableCell>
                <TableCell>{o.customers?.customer_id ?? 'N/A'}</TableCell>
                <TableCell>{o.customers?.customer_name ?? 'N/A'}</TableCell>
                <TableCell>{o.items?.name ?? 'N/A'}</TableCell>
                <TableCell>{o.demand_quantity}</TableCell>
                <TableCell>₱{Number(o.total_amount).toLocaleString()}</TableCell>
                <TableCell>{o.payment_terms}</TableCell>
                <TableCell>
                  {o.order_date ? format(new Date(o.order_date), 'MM/dd/yyyy') : 'N/A'}
                </TableCell>
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
    </div>
  );
}
