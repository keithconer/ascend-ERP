'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function PaymentStatus() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['accounts-receivable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select(`
          *,
          customers (customer_id, customer_name),
          sales_orders (order_id, items (name))
        `)
        .order('invoice_date', { ascending: false });

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        return [];
      }

      return data;
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      unpaid: 'secondary',
      overdue: 'destructive'
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getCreditStatusBadge = (hasUnpaid: boolean) => {
    return hasUnpaid ? (
      <Badge variant="destructive">DENIED - Unpaid Invoice</Badge>
    ) : (
      <Badge variant="default">APPROVED</Badge>
    );
  };

  const filteredInvoices = (invoices || []).filter((inv) => {
    const invoiceId = inv.invoice_id?.toLowerCase() || '';
    const customerName = inv.customers?.customer_name?.toLowerCase() || '';
    return (
      invoiceId.includes(searchTerm.toLowerCase()) ||
      customerName.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Customer Payment Status</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Invoice ID or Customer Name..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p>Loading payment status...</p>
        ) : filteredInvoices.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No invoices found.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Credit Status</TableHead>
                  <TableHead>Invoice Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const hasUnpaid = invoices?.some(
                    (inv) =>
                      inv.customers?.customer_id === invoice.customers?.customer_id &&
                      inv.payment_status === 'unpaid' &&
                      inv.id !== invoice.id
                  );

                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoice_id}</TableCell>
                      <TableCell>{invoice.customers?.customer_name}</TableCell>
                      <TableCell>{invoice.sales_orders?.order_id ?? 'N/A'}</TableCell>
                      <TableCell>{invoice.sales_orders?.items?.name ?? 'N/A'}</TableCell>
                      <TableCell>
                        ₱{Number(invoice.total_amount).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                      <TableCell>{getCreditStatusBadge(hasUnpaid)}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoice_date), 'MM/dd/yyyy')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
