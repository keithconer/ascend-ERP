import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Search, Plus } from 'lucide-react';
import { AddTransactionDialog } from './AddTransactionDialog';

export const StockTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['stock-transactions', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('stock_transactions')
        .select(`
          *,
          items(name, sku),
          warehouses(name)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`reference_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.limit(100);
      
      if (error) throw error;
      return data || [];
    },
  });

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'stock-in':
        return <Badge variant="default" className="bg-green-100 text-green-800">Stock In</Badge>;
      case 'stock-out':
        return <Badge variant="destructive">Stock Out</Badge>;
      case 'transfer':
        return <Badge variant="secondary">Transfer</Badge>;
      case 'adjustment':
        return <Badge variant="outline">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading transactions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Stock Transactions</CardTitle>
          <Button onClick={() => setShowAddTransaction(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference number or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{transaction.items?.name}</p>
                      <p className="text-sm text-muted-foreground">{transaction.items?.sku}</p>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.warehouses?.name}</TableCell>
                  <TableCell>{getTransactionBadge(transaction.transaction_type)}</TableCell>
                  <TableCell>
                    <span className={transaction.transaction_type === 'stock-out' ? 'text-red-600' : 'text-green-600'}>
                      {transaction.transaction_type === 'stock-out' ? '-' : '+'}{transaction.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.reference_number || '-'}</TableCell>
                  <TableCell>${transaction.unit_cost?.toFixed(2) || '-'}</TableCell>
                  <TableCell>${transaction.total_cost?.toFixed(2) || '-'}</TableCell>
                </TableRow>
              ))}
              {(!transactions || transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No transactions found.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AddTransactionDialog 
        open={showAddTransaction} 
        onOpenChange={setShowAddTransaction} 
      />
    </Card>
  );
};