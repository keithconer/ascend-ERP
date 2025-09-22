// src/pages/procurement/PurchaseRequisitionTable.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { EyeIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";
import ViewRequisitionModal from "./ViewRequisitionModal";
import { useToast } from "@/hooks/use-toast";

interface Requisition {
  id: string;
  requested_by: string;
  description: string;
  status: string;
  request_date: string;
  items: {
    item_name: string;
    quantity: number;
  }[];
}

export default function PurchaseRequisitionTable() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Requisition | null>(null);
  const [showView, setShowView] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("purchase_requisitions")
      .select(`
        id, requested_by, description, status, request_date,
        purchase_requisition_items (
          quantity,
          item_id,
          items ( name )
        )
      `);

    if (error) {
      toast({ title: "Error fetching requisitions", description: error.message });
    } else {
      const transformed = data.map((req: any) => ({
        ...req,
        items: req.purchase_requisition_items.map((item: any) => ({
          item_name: item.items.name,
          quantity: item.quantity,
        })),
      }));
      setRequisitions(transformed);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("purchase_requisitions").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message });
    } else {
      toast({ title: "Requisition deleted" });
      fetchRequisitions();
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requisition No.</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!loading && requisitions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No requisitions found.
                </TableCell>
              </TableRow>
            )}

            {requisitions.map((req) => (
              <TableRow key={req.id}>
                <TableCell>{req.id.slice(0, 8)}</TableCell>
                <TableCell>{req.requested_by}</TableCell>
                <TableCell>{req.description || "-"}</TableCell>
                <TableCell>{req.status}</TableCell>
                <TableCell>
                  {req.items.map((item) => `${item.item_name} (${item.quantity})`).join(", ")}
                </TableCell>
                <TableCell>{format(new Date(req.request_date), "PPP")}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelected(req);
                        setShowView(true);
                      }}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(req.id)}>
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selected && (
        <ViewRequisitionModal
          open={showView}
          onClose={() => setShowView(false)}
          requisition={selected}
          onUpdated={() => {
            fetchRequisitions();
            setShowView(false);
          }}
        />
      )}
    </>
  );
}
