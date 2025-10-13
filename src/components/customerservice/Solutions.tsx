import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Solutions() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("");
  const [solutionType, setSolutionType] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data: availableIssues } = useQuery({
    queryKey: ["available_issues"],
    queryFn: async () => {
      const { data: issuesData, error } = await supabase
        .from("customer_issues")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const issuesWithoutSolutions = [];
      for (const issue of issuesData) {
        const { count } = await supabase
          .from("customer_solutions")
          .select("*", { count: "exact", head: true })
          .eq("issue_id", issue.issue_id);

        if (count === 0) {
          issuesWithoutSolutions.push(issue);
        }
      }

      const ticketIds = [...new Set(issuesWithoutSolutions.map((i) => i.ticket_id))];
      const { data: tickets } = await supabase
        .from("customer_tickets")
        .select("*")
        .in("ticket_id", ticketIds);

      return issuesWithoutSolutions.map((issue) => ({
        ...issue,
        ticket: tickets?.find((t) => t.ticket_id === issue.ticket_id),
      }));
    },
  });

  const { data: solutions } = useQuery({
    queryKey: ["customer_solutions"],
    queryFn: async () => {
      const { data: solutionsData, error } = await supabase
        .from("customer_solutions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const issueIds = [...new Set(solutionsData.map((s) => s.issue_id))];
      const { data: issues } = await supabase
        .from("customer_issues")
        .select("*")
        .in("issue_id", issueIds);

      const ticketIds = [...new Set(solutionsData.map((s) => s.ticket_id))];
      const { data: tickets } = await supabase
        .from("customer_tickets")
        .select("*")
        .in("ticket_id", ticketIds);

      return solutionsData.map((solution) => ({
        ...solution,
        issue: issues?.find((i) => i.issue_id === solution.issue_id),
        ticket: tickets?.find((t) => t.ticket_id === solution.ticket_id),
      }));
    },
  });

  const createSolutionMutation = useMutation({
    mutationFn: async () => {
      const issue = availableIssues?.find((i) => i.issue_id === selectedIssue);
      if (!issue) throw new Error("Issue not found");

      const { error } = await supabase.from("customer_solutions").insert({
        ticket_id: issue.ticket_id,
        issue_id: issue.issue_id,
        solution_type: solutionType,
        quantity: solutionType !== "Refund" ? quantity : null,
        solution_id: "",
        status: "pending",
      } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solution created successfully");
      queryClient.invalidateQueries({ queryKey: ["customer_solutions"] });
      queryClient.invalidateQueries({ queryKey: ["available_issues"] });
      queryClient.invalidateQueries({ queryKey: ["customer_issues"] });
      queryClient.invalidateQueries({ queryKey: ["customer_tickets"] });
      setSelectedIssue("");
      setSolutionType("");
      setQuantity(1);
    },
    onError: (error: any) => {
      toast.error(`Failed to create solution: ${error.message}`);
    },
  });

  const filteredSolutions = solutions?.filter((solution) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      solution.solution_id?.toLowerCase().includes(searchLower) ||
      solution.solution_type?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4 p-6 bg-card rounded-lg border">
        <h3 className="text-lg font-semibold">Create Solution</h3>

        <div className="space-y-2">
          <Label>Issue</Label>
          <Select value={selectedIssue} onValueChange={setSelectedIssue}>
            <SelectTrigger>
              <SelectValue placeholder="Select issue" />
            </SelectTrigger>
            <SelectContent>
              {availableIssues?.map((issue) => (
                <SelectItem key={issue.id} value={issue.issue_id}>
                  {issue.issue_id} - {issue.issue_type} ({issue.ticket?.customer_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Solution Type</Label>
          <Select value={solutionType} onValueChange={setSolutionType}>
            <SelectTrigger>
              <SelectValue placeholder="Select solution" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Replacement">Replacement</SelectItem>
              <SelectItem value="Ship missing item">Ship missing item</SelectItem>
              <SelectItem value="Refund">Refund</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {solutionType && solutionType !== "Refund" && (
          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
        )}

        <Button
          onClick={() => createSolutionMutation.mutate()}
          disabled={
            !selectedIssue || !solutionType || createSolutionMutation.isPending
          }
        >
          {createSolutionMutation.isPending ? "Creating..." : "Create Solution"}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Solutions History</h3>
        <input
          type="text"
          placeholder="Search by Solution ID, or Solution Type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solution ID</TableHead>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Issue ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Solution Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSolutions?.map((solution) => (
                <SolutionRow key={solution.id} solution={solution} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function SolutionRow({ solution }: any) {
  const { data: customer } = useQuery({
    queryKey: ["customer_for_solution", solution.issue_id],
    queryFn: async () => {
      const { data: issue, error: issueErr } = await supabase
        .from("customer_issues")
        .select("customer_id")
        .eq("issue_id", solution.issue_id)
        .maybeSingle();

      if (issueErr || !issue?.customer_id) return null;

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", issue.customer_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  return (
    <TableRow>
      <TableCell className="font-medium">{solution.solution_id}</TableCell>
      <TableCell>{solution.ticket_id}</TableCell>
      <TableCell>{solution.issue_id}</TableCell>
      <TableCell>
        {customer?.customer_name || solution.ticket?.customer_name || "—"}
      </TableCell>
      <TableCell>{solution.solution_type}</TableCell>
      <TableCell>{solution.quantity || "N/A"}</TableCell>
      <TableCell>
        <Badge
          variant={solution.status === "resolved" ? "default" : "secondary"}
        >
          {solution.status}
        </Badge>
      </TableCell>
      <TableCell>
        {new Date(solution.created_at).toLocaleDateString()}
      </TableCell>
    </TableRow>
  );
}
