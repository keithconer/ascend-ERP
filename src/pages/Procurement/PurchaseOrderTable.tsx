'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { EyeIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ViewPurchaseOrderModal from './ViewPurchaseOrderModal';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

// Helper function to format Peso
const formatPeso = (value: number | string) => {
  if (typeof value === 'string') value = parseFloat(value);
  return `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

interface Item {
  item_name: string;
  quantity: number;
  price: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  requisition_id: string | null;
  supplier_name: string;
  order_date: string;
  status: string;
  notes: string | null;
  items: Item[];
  total: number;
}

export default function PurchaseOrderTable() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showView, setShowView] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [searchTerm]);

  // Fetch purchase orders from the database
  async function fetchPurchaseOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        po_number,
        requisition_id,
        order_date,
        status,
        notes,
        supplier_id,
        suppliers (
          name
        ),
        purchase_order_items (
          quantity,
          price,
          item_id,
          items (
            name,
            unit_price
          )
        )
      `)
      .order('order_date', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading purchase orders',
        description: error.message,
        variant: 'destructive',
      });
      setPurchaseOrders([]);
    } else {
      const transformed = (data || []).map((po: any) => {
        const items: Item[] = (po.purchase_order_items || []).map((i: any) => ({
          item_name: i.items?.name ?? 'Unknown',
          quantity: i.quantity,
          price: i.items?.unit_price ?? i.price ?? 0,
        }));

        const total = items.reduce(
          (acc: number, i: Item) => acc + i.price * i.quantity,
          0
        );

        return {
          id: po.id,
          po_number: po.po_number,
          requisition_id: po.requisition_id,
          supplier_name: po.suppliers?.name ?? 'Unknown Supplier',
          order_date: po.order_date,
          status: po.status,
          notes: po.notes,
          items,
          total,
        };
      });

      setPurchaseOrders(transformed);
    }

    setLoading(false);
  }

  function openViewModal(po: PurchaseOrder) {
    setSelected(po);
    setShowView(true);
  }

  async function handleDelete(poId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this purchase order, its associated requisition, and receipts? This action cannot be undone.'
    );
    if (!confirmed) return;

    setDeletingId(poId);

    try {
      // Fetch requisition_id from the purchase order
      const { data: poData, error: fetchError } = await supabase
        .from('purchase_orders')
        .select('requisition_id')
        .eq('id', poId)
        .single();

      if (fetchError) throw fetchError;

      const requisitionId = poData?.requisition_id;

      // Delete the purchase order (this also deletes related receipts if ON DELETE CASCADE is used)
      const { error: deletePoError } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poId);

      if (deletePoError) throw deletePoError;

      // Delete associated requisition, if it exists
      if (requisitionId) {
        const { error: deleteReqError } = await supabase
          .from('purchase_requisitions')
          .delete()
          .eq('id', requisitionId);

        if (deleteReqError) throw deleteReqError;
      }

      toast({
        title: 'Purchase order and requisition deleted',
        variant: 'success',
      });

      fetchPurchaseOrders();
    } catch (err: any) {
      toast({
        title: 'Failed to delete',
        description: err.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between mb-4 items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Purchase Orders</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search by supplier name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Requisition</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && purchaseOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No purchase orders found.
                </TableCell>
              </TableRow>
            )}
            {purchaseOrders.map((po) => (
              <TableRow key={po.id}>
                <TableCell>{po.po_number}</TableCell>
                <TableCell>{po.requisition_id?.slice(0, 8) ?? '-'}</TableCell>
                <TableCell>{po.supplier_name}</TableCell>
                <TableCell>{format(new Date(po.order_date), 'PPP')}</TableCell>
                <TableCell>{po.status}</TableCell>
                <TableCell>
                  {po.items.map((i) => `${i.item_name} (${i.quantity})`).join(', ')}
                </TableCell>
                <TableCell>{formatPeso(po.total)}</TableCell>
                <TableCell className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openViewModal(po)}
                    aria-label="View Purchase Order"
                    disabled={deletingId === po.id}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(po.id)}
                    aria-label="Delete Purchase Order"
                    disabled={deletingId === po.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected && showView && (
        <ViewPurchaseOrderModal
          open={showView}
          onClose={() => setShowView(false)}
          purchaseOrder={selected}
          onUpdated={fetchPurchaseOrders}
        />
      )}
    </>
  );
}
