import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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

// Helper function to calculate total stock for each item
const calculateTotalStock = (transactions: any[]) => {
  return transactions.reduce((totals: { [key: string]: number }, transaction) => {
    const { item_id, quantity, transaction_type } = transaction;

    if (!totals[item_id]) {
      totals[item_id] = 0;
    }

    // Adjust total stock based on transaction type
    if (transaction_type === 'stock-in') {
      totals[item_id] += quantity;
    } else if (transaction_type === 'stock-out') {
      totals[item_id] -= quantity;
    } else if (transaction_type === 'adjustment') {
      totals[item_id] += quantity; // Assuming adjustment is like stock-in
    }

    return totals;
  }, {});
};

// Assume a fixed USD to PHP conversion rate
// Ideally, you can fetch the current rate dynamically from an API.
const USD_TO_PHP = 58; // Example conversion rate (1 USD = 58 PHP)

// Helper function to format currency in Peso (₱)
const formatCurrency = (value: number | string) => {
  if (typeof value === 'string') value = parseFloat(value);
  return `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

// Main Stock Transactions Component
export const StockTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // Debounce search input (300ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch all transactions (limit to 100)
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['stock-transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_transactions')
        .select(`
          *,
          items(name, sku),
          warehouses(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate the total stock per item
  const totalStock = useMemo(() => {
    if (transactions) {
      return calculateTotalStock(transactions);
    }
    return {};
  }, [transactions]);

  // Filter transactions by item name on client side
  const filteredTransactions = useMemo(() => {
    if (!debouncedSearch) return transactions || [];
    return (transactions || []).filter(tx =>
      tx.items?.name.toLowerCase().includes(debouncedSearch)
    );
  }, [debouncedSearch, transactions]);

  // Get transaction badge based on type
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
        <div className="flex items-center space-x-2 mt-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by item name..."
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
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => {
                  // Convert unit cost and total cost to Peso
                  const unitCostInPHP = (transaction.unit_cost || 0) * USD_TO_PHP;
                  const totalCostInPHP = (transaction.total_cost || 0) * USD_TO_PHP;

                  return (
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
                          {totalStock[transaction.item_id] || 0}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.reference_number || '-'}</TableCell>
                      <TableCell>{formatCurrency(unitCostInPHP)}</TableCell> {/* Converted to Peso */}
                      <TableCell>{formatCurrency(totalCostInPHP)}</TableCell> {/* Converted to Peso */}
                    </TableRow>
                  );
                })
              ) : (
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
