import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function AccountsReceivable() {
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['accounts-receivable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select(`
          *,
          customers (customer_id, customer_name, contact_info),
          sales_orders (order_id, items (name))
        `)
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({ 
          payment_status: 'paid',
          paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Invoice marked as paid. Inventory updated and sales order completed.' });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
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
        <CardTitle>Accounts Receivable</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading...</p>
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
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.map((invoice) => {
                const hasUnpaid = invoices.some(
                  inv => inv.customers?.customer_id === invoice.customers?.customer_id && 
                         inv.payment_status === 'unpaid' && 
                         inv.id !== invoice.id
                );
                
                return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_id}</TableCell>
                    <TableCell>
                      <div>
                        <p>{invoice.customers?.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{invoice.customers?.customer_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{invoice.sales_orders?.order_id}</TableCell>
                    <TableCell>{invoice.sales_orders?.items?.name}</TableCell>
                    <TableCell>₱{Number(invoice.total_amount).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                    <TableCell>{getCreditStatusBadge(hasUnpaid)}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), 'MM/dd/yyyy')}</TableCell>
                    <TableCell>
                      {invoice.due_date ? format(new Date(invoice.due_date), 'MM/dd/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {invoice.payment_status === 'unpaid' && (
                        <Button
                          size="sm"
                          onClick={() => markAsPaidMutation.mutate(invoice.id)}
                          disabled={markAsPaidMutation.isPending}
                        >
                          Mark as Paid
                        </Button>
                      )}
                      {invoice.payment_status === 'paid' && invoice.paid_date && (
                        <p className="text-sm text-muted-foreground">
                          Paid: {format(new Date(invoice.paid_date), 'MM/dd/yyyy')}
                        </p>
                      )}
                    </TableCell>
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
