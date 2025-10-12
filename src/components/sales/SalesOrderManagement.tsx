'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Eye, Trash2, FileText, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';

export default function SalesOrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: salesOrders, isLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          customers (customer_id, customer_name, contact_info),
          items (name, sku),
          employees (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const order = salesOrders?.find(o => o.id === orderId);
      if (!order) throw new Error('Order not found');

      const { data: creditCheck } = await supabase.rpc('check_customer_credit_status', {
        p_customer_id: order.customer_id
      });

      if (creditCheck && creditCheck[0]?.has_unpaid) {
        throw new Error(`Customer has ${creditCheck[0].unpaid_count} unpaid invoice(s). Cannot create new invoice.`);
      }

      const invoiceId = await supabase.rpc('generate_invoice_id').then(res => res.data);

      const { error } = await supabase.from('accounts_receivable').insert({
        invoice_id: invoiceId,
        sales_order_id: orderId,
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        unit_price: order.total_amount / order.demand_quantity,
        payment_status: 'unpaid',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Invoice created successfully' });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (order: any) => {
      const { error: orderError } = await supabase
        .from('sales_orders')
        .delete()
        .eq('id', order.id);

      if (orderError) throw orderError;

      if (order.quotation_id) {
        await supabase.from('quotations').delete().eq('quotation_id', order.quotation_id);
      }

      if (order.lead_id) {
        await supabase.from('leads').delete().eq('lead_id', order.lead_id);
      }
    },
    onSuccess: () => {
      toast({ title: 'Sales order and related records deleted' });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error deleting order', description: error.message, variant: 'destructive' });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      processed: 'default',
      delivered: 'default',
      complete: 'default'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  // Filter sales orders
  const filteredOrders = salesOrders?.filter((order) => {
    const customerName = order.customers?.customer_name?.toLowerCase() || '';
    const productName = order.items?.name?.toLowerCase() || '';
    const term = searchTerm.toLowerCase();
    return customerName.includes(term) || productName.includes(term);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Order Management</CardTitle>
        <div className="relative mt-4 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_id}</TableCell>
                  <TableCell>{order.customers?.customer_id}</TableCell>
                  <TableCell>{order.customers?.customer_name}</TableCell>
                  <TableCell>{order.items?.name}</TableCell>
                  <TableCell>{order.demand_quantity}</TableCell>
                  <TableCell>₱{Number(order.total_amount).toLocaleString()}</TableCell>
                  <TableCell>{order.payment_terms}</TableCell>
                  <TableCell>{format(new Date(order.order_date), 'MM/dd/yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(order.delivery_status)}</TableCell>
                  <TableCell>
                    {order.employees ? `${order.employees.first_name} ${order.employees.last_name}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={viewDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                        setViewDialogOpen(open);
                        if (!open) setSelectedOrder(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Order Details - {order.order_id}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="font-semibold">Customer</p>
                                <p>{order.customers?.customer_name}</p>
                                <p className="text-sm text-muted-foreground">{order.customers?.customer_id}</p>
                              </div>
                              <div>
                                <p className="font-semibold">Product</p>
                                <p>{order.items?.name}</p>
                                <p className="text-sm text-muted-foreground">{order.items?.sku}</p>
                              </div>
                              <div>
                                <p className="font-semibold">Quantity</p>
                                <p>{order.demand_quantity} units</p>
                              </div>
                              <div>
                                <p className="font-semibold">Total Amount</p>
                                <p>₱{Number(order.total_amount).toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="font-semibold">Status</p>
                                {getStatusBadge(order.delivery_status)}
                              </div>
                              <div>
                                <p className="font-semibold">Order Date</p>
                                <p>{format(new Date(order.order_date), 'MM/dd/yyyy')}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-4">
                              <Button
                                onClick={() => createInvoiceMutation.mutate(order.id)}
                                disabled={createInvoiceMutation.isPending}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Create Invoice
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  if (confirm('This will delete the order and related quotation/lead. Continue?')) {
                                    deleteMutation.mutate(order);
                                    setViewDialogOpen(false);
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm('This will permanently delete the order and related records. Continue?')) {
                            deleteMutation.mutate(order);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
