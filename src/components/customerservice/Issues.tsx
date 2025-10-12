import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Issues() {
  const { data: issues } = useQuery({
    queryKey: ["customer_issues"],
    queryFn: async () => {
      const { data: issuesData, error } = await supabase
        .from("customer_issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch related tickets and orders
      const ticketIds = [...new Set(issuesData.map((i) => i.ticket_id))];
      const orderIds = [...new Set(issuesData.filter((i) => i.order_id).map((i) => i.order_id))];

      const { data: tickets } = await supabase
        .from("customer_tickets")
        .select("*")
        .in("ticket_id", ticketIds);

      const { data: orders } = orderIds.length
        ? await supabase.from("sales_orders").select("*").in("id", orderIds)
        : { data: [] };

      // Combine data
      return issuesData.map((issue) => ({
        ...issue,
        ticket: tickets?.find((t) => t.ticket_id === issue.ticket_id),
        order: orders?.find((o) => o.id === issue.order_id),
      }));
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Issues</h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue ID</TableHead>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Issue Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues?.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">{issue.issue_id}</TableCell>
                <TableCell>{issue.ticket_id}</TableCell>
                <TableCell>{issue.ticket?.customer_name}</TableCell>
                <TableCell>{issue.order?.order_id || "N/A"}</TableCell>
                <TableCell>{issue.issue_type}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      issue.status === "resolved" ? "default" : "secondary"
                    }
                  >
                    {issue.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      issue.ticket?.priority === "high"
                        ? "destructive"
                        : issue.ticket?.priority === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {issue.ticket?.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(issue.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
