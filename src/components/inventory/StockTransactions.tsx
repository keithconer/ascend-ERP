// StockTransactions.tsx
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AddTransactionDialog } from './AddTransactionDialog';

export function StockTransactions() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['stock-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_transactions')
        .select(`
          id,
          transaction_type,
          quantity,
          unit_cost,
          total_cost,
          reference_number,
          notes,
          expiration_date,
          created_at,
          items ( name ),
          warehouses ( name )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const handleTransactionAdded = () => {
    queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Transaction Log</CardTitle>
        <Button onClick={() => setOpen(true)}>Add Transaction</Button>
      </CardHeader>
      <CardContent>
        <AddTransactionDialog
          open={open}
          onOpenChange={setOpen}
          transactionTypes={['stock-in', 'stock-out']} // ✅ removed transfer
          onTransactionAdded={handleTransactionAdded}
        />

        {isLoading ? (
          <p>Loading transactions...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Expiration</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((tx, index) => (
                <TableRow key={tx.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{tx.transaction_type}</TableCell>
                  <TableCell>{tx.items?.name || 'N/A'}</TableCell>
                  <TableCell>{tx.warehouses?.name || 'N/A'}</TableCell>
                  <TableCell>{tx.quantity}</TableCell>
                  <TableCell>{tx.unit_cost}</TableCell>
                  <TableCell>{tx.total_cost}</TableCell>
                  <TableCell>{tx.reference_number}</TableCell>

                  {/* ✅ Only show relevant warehouse info */}
                  <TableCell>
                    {tx.transaction_type === 'stock-in' && `Received in ${tx.warehouses?.name || 'Warehouse'}`}
                    {tx.transaction_type === 'stock-out' && `Taken from ${tx.warehouses?.name || 'Warehouse'}`}
                  </TableCell>

                  <TableCell>
                    {tx.expiration_date
                      ? new Date(tx.expiration_date).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
