import { useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const { data: issues } = useQuery({
    queryKey: ["customer_issues"],
    queryFn: async () => {
      const { data: issuesData, error } = await supabase
        .from("customer_issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ticketIds = [...new Set(issuesData.map((i) => i.ticket_id))];
      const orderIds = [...new Set(issuesData.filter((i) => i.order_id).map((i) => i.order_id))];

      const { data: tickets } = await supabase
        .from("customer_tickets")
        .select("*")
        .in("ticket_id", ticketIds);

      const { data: orders } = orderIds.length
        ? await supabase.from("sales_orders").select("*").in("id", orderIds)
        : { data: [] };

      return issuesData.map((issue) => ({
        ...issue,
        ticket: tickets?.find((t) => t.ticket_id === issue.ticket_id),
        order: orders?.find((o) => o.id === issue.order_id),
      }));
    },
  });

  const filteredIssues = issues?.filter((issue) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      issue.issue_id?.toLowerCase().includes(searchLower) ||
      issue.ticket?.customer_name?.toLowerCase().includes(searchLower) ||
      issue.issue_type?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Issues</h3>
      <input
        type="text"
        placeholder="Search by Issue ID, Customer Name, or Issue Type..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
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
            {filteredIssues?.map((issue) => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function IssueRow({ issue }: any) {
  const { data: customer } = useQuery({
    queryKey: ["customer", issue.customer_id],
    queryFn: async () => {
      if (!issue.customer_id) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", issue.customer_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!issue.customer_id,
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{issue.issue_id}</TableCell>
      <TableCell>{issue.ticket_id}</TableCell>
      <TableCell>
        {customer?.customer_name || issue.ticket?.customer_name || "—"}
      </TableCell>
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
  );
}
