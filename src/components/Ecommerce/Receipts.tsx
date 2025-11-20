import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Receipt, FileText } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Receipts = () => {
  const { data: receipts, isLoading, refetch } = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select(`
          *,
          customers(customer_name, contact_info),
          items(name, sku)
        `)
        .eq("delivery_status", "complete")
        .not("receipt_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sales_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Receipt deleted successfully");
      refetch();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete receipt", {
        description: error.message
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!receipts || receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <FileText className="w-24 h-24 text-muted-foreground/50 mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">No receipts yet</h3>
        <p className="text-muted-foreground">Completed orders will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Receipt className="w-8 h-8 text-primary" />
          Receipts
        </h2>
        <p className="text-muted-foreground">View all completed orders and receipts</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Completed Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono font-semibold text-primary">
                      {receipt.receipt_id}
                    </TableCell>
                    <TableCell className="font-mono">
                      {receipt.order_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{receipt.customers?.customer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {receipt.customers?.contact_info?.split('|')[0]}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{receipt.items?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {receipt.items?.sku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{receipt.demand_quantity}</TableCell>
                    <TableCell className="font-semibold text-primary">
                      ₱{receipt.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{receipt.payment_terms}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(receipt.order_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-success text-success-foreground">
                        {receipt.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(receipt.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};