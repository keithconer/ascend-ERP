import { useGoodsReceipts } from "@/hooks/useGoodsReceipts";
import { format } from "date-fns";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

export default function GoodsReceiptTable() {
  const { receipts, loading, error } = useGoodsReceipts();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Goods Receipts</h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GR Number</TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No goods receipts found.
                </TableCell>
              </TableRow>
            )}
            {receipts.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.gr_number}</TableCell>
                <TableCell>{r.po_number}</TableCell>
                <TableCell>{r.invoice_number}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell>{format(new Date(r.created_at), "PPP")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
