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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

type ProductStatusRow = {
  item_id: string;
  sku: string;
  name: string;
  total_qty: number;
  available_qty: number;
};

export default function ProductStatus() {
  const [rows, setRows] = useState<ProductStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProductStatus = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        item_id,
        quantity,
        available_quantity,
        items ( sku, name )
      `);

    if (error) {
      toast.error('Failed to fetch product status: ' + error.message);
      setLoading(false);
      return;
    }

    const result = (data || []).map((inv) => ({
      item_id: inv.item_id,
      sku: inv.items?.sku ?? 'N/A',
      name: inv.items?.name ?? 'N/A',
      total_qty: inv.quantity,
      available_qty: inv.available_quantity,
    }));

    setRows(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchProductStatus();
  }, []);

  const getStatus = (total: number, available: number) => {
    if (available === 0) return 'Out of Stock';
    if (available < total) return 'Partially Available';
    return 'In Stock';
  };

  const filteredRows = rows.filter((row) =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Product Inventory Status</span>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading ? (
          <p>Loading product status...</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center">No products match your search.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead>Total Qty</TableHead>
                <TableHead>Available Qty</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.item_id}>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.total_qty}</TableCell>
                  <TableCell>{row.available_qty}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.available_qty === 0
                          ? 'destructive'
                          : row.available_qty < row.total_qty
                          ? 'secondary'
                          : 'default'
                      }
                    >
                      {getStatus(row.total_qty, row.available_qty)}
                    </Badge>
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
