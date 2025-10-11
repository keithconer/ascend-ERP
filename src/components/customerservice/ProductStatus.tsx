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

  const fetchProductStatus = async () => {
    // Select from inventory and join items
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

    // Transform
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

  if (loading) {
    return <p>Loading product status...</p>;
  }

  if (rows.length === 0) {
    return <p>No products found in inventory.</p>;
  }

  const getStatus = (total: number, available: number) => {
    if (available === 0) return 'Out of Stock';
    if (available < total) return 'Partially Available';
    return 'In Stock';
  };

  return (
    <div className="overflow-x-auto">
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
          {rows.map((row) => (
            <TableRow key={row.item_id}>
              <TableCell>{row.sku}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.total_qty}</TableCell>
              <TableCell>{row.available_qty}</TableCell>
              <TableCell>{getStatus(row.total_qty, row.available_qty)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
