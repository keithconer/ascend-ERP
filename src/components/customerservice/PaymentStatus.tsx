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
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function PaymentStatus() {
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
    return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  const getCreditStatusBadge = (hasUnpaid: boolean) => {
    return hasUnpaid ? (
      <Badge variant="destructive">DENIED - Unpaid Invoice</Badge>
    ) : (
      <Badge variant="default">APPROVED</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Payment Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading payment status...</p>
        ) : invoices && invoices.length === 0 ? (
          <p className="text-center text-muted-foreground">No invoices found.</p>
        ) : (
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
              {invoices?.map((invoice) => {
                const hasUnpaid = invoices.some(
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
                    <TableCell>₱{Number(invoice.total_amount).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                    <TableCell>{getCreditStatusBadge(hasUnpaid)}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), 'MM/dd/yyyy')}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
