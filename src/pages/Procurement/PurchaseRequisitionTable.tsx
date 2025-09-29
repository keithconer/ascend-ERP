'use client';

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
import { EyeIcon, Trash2Icon } from "lucide-react";
import { format } from "date-fns";
import ViewRequisitionModal from "./ViewRequisitionModal";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Requisition {
  id: string;
  description: string;
  status: string;
  request_date: string;
  supplier_id: string;
  supplier_name: string;
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
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchRequisitions(searchTerm);
  }, [searchTerm]);

  const fetchRequisitions = async (search: string = "") => {
    setLoading(true);

    // Build the query; use !inner join on suppliers to force existence
    let query = supabase
      .from("purchase_requisitions")
      .select(`
        id,
        description,
        status,
        request_date,
        supplier_id,
        suppliers!inner (
          name
        ),
        purchase_requisition_items (
          quantity,
          item_id,
          items (
            name
          )
        )
      `);

    // If user has typed something to search
    if (search.trim()) {
      // filter on the joined supplier name
      query = query.ilike("suppliers.name", `%${search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error fetching requisitions",
        description: error.message,
      });
      setLoading(false);
      return;
    }

    // Transform data to your Requisition type
    const transformed = (data || []).map((req: any) => ({
      id: req.id,
      description: req.description,
      status: req.status,
      request_date: req.request_date,
      supplier_id: req.supplier_id,
      supplier_name: req.suppliers?.name ?? "Unknown Supplier",
      items: (req.purchase_requisition_items || []).map((item: any) => ({
        item_name: item.items?.name ?? "(Unknown item)",
        quantity: item.quantity,
      })),
    }));

    setRequisitions(transformed);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("purchase_requisitions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Delete failed", description: error.message });
    } else {
      toast({ title: "Requisition deleted" });
      fetchRequisitions(searchTerm);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-semibold">Purchase Requisitions</h2>
        <Input
          placeholder="Search by supplier name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Requisition No.</TableHead>
              <TableHead>Supplier</TableHead>
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
                <TableCell>{req.supplier_name}</TableCell>
                <TableCell>{req.description || "-"}</TableCell>
                <TableCell>{req.status}</TableCell>
                <TableCell>
                  {req.items
                    .map((item) => `${item.item_name} (${item.quantity})`)
                    .join(", ")}
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(req.id)}
                    >
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
            fetchRequisitions(searchTerm);
            setShowView(false);
          }}
        />
      )}
    </>
  );
}
