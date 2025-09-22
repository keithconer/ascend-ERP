import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { EyeIcon } from "lucide-react";
import { format } from "date-fns";
import PurchaseOrderForm from "./PurchaseOrderForm";
import ViewPurchaseOrderModal from "./ViewPurchaseOrderModal";
import { useToast } from "@/hooks/use-toast";

interface Item {
  item_name: string;
  quantity: number;
  price: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  po_number: string | null;
  requisition: {
    id: string;
    requested_by: string;
  } | null;
  supplier: Supplier | null;
  order_date: string;
  status: string;
  notes: string | null;
  items: Item[];
  total: number;
}

export default function PurchaseOrderTable() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showView, setShowView] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  async function fetchPurchaseOrders() {
    setLoading(true);

    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        id,
        po_number,
        requisition: purchase_requisitions!inner (
          id,
          requested_by
        ),
        supplier: suppliers (
          id,
          name
        ),
        order_date,
        status,
        notes,
        purchase_order_items (
          quantity,
          price,
          items: items!purchase_order_items_item_id_fkey (
            name
          )
        )
      `)
      .order("order_date", { ascending: false });

    if (error) {
      toast({ title: "Error loading purchase orders", description: error.message });
      setPurchaseOrders([]);
    } else {
      // Transform data to include total and map items properly
      const transformed = data.map((po: any) => {
        const items = po.purchase_order_items.map((i: any) => ({
          item_name: i.items.name,
          quantity: i.quantity,
          price: i.price,
        }));

        const total = items.reduce((acc: number, i: any) => acc + i.price * i.quantity, 0);

        return {
          id: po.id,
          po_number: po.po_number ?? po.id.slice(0, 8), // fallback if no po_number
          requisition: po.requisition,
          supplier: po.supplier,
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

  function openNewForm() {
    setSelected(null);
    setShowForm(true);
  }

  function openViewModal(po: PurchaseOrder) {
    setSelected(po);
    setShowView(true);
  }

  return (
    <>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Button onClick={openNewForm}>New Purchase Order</Button>
      </div>

      {loading ? (
        <p>Loading purchase orders...</p>
      ) : (
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
              {purchaseOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No purchase orders found.
                  </TableCell>
                </TableRow>
              ) : (
                purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>{po.po_number}</TableCell>
                    <TableCell>{po.requisition?.id.slice(0, 8) ?? "-"}</TableCell>
                    <TableCell>{po.supplier?.name ?? "-"}</TableCell>
                    <TableCell>{format(new Date(po.order_date), "PPP")}</TableCell>
                    <TableCell>{po.status}</TableCell>
                    <TableCell>
                      {po.items.map((i, idx) => (
                        <span key={idx}>
                          {i.item_name} ({i.quantity}){idx < po.items.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </TableCell>
                    <TableCell>${po.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewModal(po)}
                        aria-label="View Purchase Order"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <PurchaseOrderForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onCreated={fetchPurchaseOrders}
        />
      )}

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
