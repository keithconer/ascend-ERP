// StockTransactions.tsx
import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { AddTransactionDialog } from './AddTransactionDialog';

// 🔹 Types
interface Item {
  id: string;
  name: string;
  sku: string;
  expiration_date?: string | null;
}

interface Warehouse {
  id: string;
  name: string;
}

interface StockTransaction {
  id: string;
  created_at: string;
  reference_number?: string | null;
  notes?: string | null;
  transaction_type: 'stock-in' | 'stock-out' | 'transfer' | 'adjustment';
  quantity: number;
  unit_cost?: number | null;
  total_cost?: number | null;
  items: Item;
  warehouses: Warehouse;
}

export const StockTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [suggestions, setSuggestions] = useState<StockTransaction[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 🔹 Helper functions to display item info safely
  const displayItemName = (item: Item | undefined) => item?.name || '-';
  const displayItemSKU = (item: Item | undefined) => item?.sku || '-';
  const displayItemExpiration = (item: Item | undefined) =>
    item?.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '-';

  const { data: transactions, isLoading } = useQuery<StockTransaction[], Error>({
    queryKey: ['stock-transactions'],
    queryFn: async () => {
      // 1️⃣ Get all transactions
      const { data, error } = await supabase
        .from('stock_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      // 2️⃣ Fetch items and warehouses for each transaction
      const transactionsWithRelations: StockTransaction[] = await Promise.all(
        data.map(async (tx) => {
          const { data: item } = await supabase
            .from('items')
            .select('id, name, sku, expiration_date')
            .eq('id', tx.item_id)
            .single();

          const { data: warehouse } = await supabase
            .from('warehouses')
            .select('id, name')
            .eq('id', tx.warehouse_id)
            .single();

          return {
            ...tx,
            items: item ?? { id: '', name: '-', sku: '-', expiration_date: null },
            warehouses: warehouse ?? { id: '', name: '-' },
          };
        })
      );

      return transactionsWithRelations;
    },
  });

  const filteredTransactions = transactions?.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.reference_number?.toLowerCase().includes(term) ||
      t.notes?.toLowerCase().includes(term)
    );
  });

  // 🔹 Suggestions while typing
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSuggestions([]);
        return;
      }
      setIsFetchingSuggestions(true);

      const { data, error } = await supabase
        .from('stock_transactions')
        .select('id, reference_number, notes')
        .or(`reference_number.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
        .limit(5);

      if (!error && data) setSuggestions(data as StockTransaction[]);
      else setSuggestions([]);

      setIsFetchingSuggestions(false);
    }, 200);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 🔹 Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTransactionBadge = (type: StockTransaction['transaction_type']) => {
    switch (type) {
      case 'stock-in':
        return <Badge className="bg-green-100 text-green-800">Stock In</Badge>;
      case 'stock-out':
        return <Badge className="bg-red-100 text-red-800">Stock Out</Badge>;
      case 'transfer':
        return <Badge className="bg-blue-100 text-blue-800">Transfer</Badge>;
      case 'adjustment':
        return <Badge className="bg-yellow-100 text-yellow-800">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const handleTransactionAdded = () => {
    setShowAddTransaction(false);
    queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-16">
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
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <div className="relative flex-1 max-w-sm" ref={searchRef}>
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reference or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 bg-white border rounded-md mt-1 w-full shadow-md">
                {isFetchingSuggestions && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                )}
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setSearchTerm(s.reference_number || s.notes || '');
                      setSuggestions([]);
                    }}
                  >
                    {s.reference_number || <span className="italic">{s.notes}</span>}
                  </div>
                ))}
              </div>
            )}
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
                <TableHead>Expiration</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
           <TableBody>
  {filteredTransactions?.map((transaction) => (
    <TableRow key={transaction.id}>
      <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
      <TableCell>
        <p className="font-medium">{displayItemName(transaction.items)}</p>
        <p className="text-sm text-muted-foreground">{displayItemSKU(transaction.items)}</p>
      </TableCell>
      <TableCell>{transaction.warehouses?.name || '-'}</TableCell>
      <TableCell>{getTransactionBadge(transaction.transaction_type)}</TableCell>
      <TableCell>
        <span className={transaction.transaction_type === 'stock-out' ? 'text-red-600' : 'text-green-600'}>
          {transaction.transaction_type === 'stock-out' ? '-' : '+'}{transaction.quantity}
        </span>
      </TableCell>
      <TableCell>{transaction.reference_number || '-'}</TableCell>
      <TableCell>{displayItemExpiration(transaction.items)}</TableCell>
      <TableCell>${transaction.unit_cost?.toFixed(2) || '-'}</TableCell>
      <TableCell>${transaction.total_cost?.toFixed(2) || '-'}</TableCell>
    </TableRow>
  ))}
  {!filteredTransactions?.length && (
    <TableRow>
      <TableCell colSpan={9} className="text-center py-8">
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
        transactionTypes={['stock-in', 'stock-out', 'transfer', 'adjustment']}
        onTransactionAdded={handleTransactionAdded}
      />
    </Card>
  );
};
