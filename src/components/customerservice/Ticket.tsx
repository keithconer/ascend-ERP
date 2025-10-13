import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DeleteTicket from "./DeleteTicket";
import { Badge } from "@/components/ui/badge";

export default function Ticket() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    customer_id: "",
    order_id: "",
    issue_type: "",
    description: "",
    priority: "medium",
    assigned_to: "",
    internal_notes: "",
  });

  // Fetch customers that exist in sales_orders
  const { data: customers } = useQuery({
    queryKey: ["customers_in_sales_orders"],
    queryFn: async () => {
      const { data: orders, error: ordersErr } = await supabase
        .from("sales_orders")
        .select("customer_id");
      if (ordersErr) throw ordersErr;

      const customerIds = [...new Set(orders?.map(o => o.customer_id).filter(Boolean))];
      if (customerIds.length === 0) return [];

      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .in("id", customerIds)
        .is("deleted_at", null)
        .order("customer_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch employees for assignment
  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch orders for selected customer
  const { data: orders } = useQuery({
    queryKey: ["sales_orders", formData.customer_id],
    queryFn: async () => {
      if (!formData.customer_id) return [];
      const { data, error } = await supabase
        .from("sales_orders")
        .select("*")
        .eq("customer_id", formData.customer_id)
        .order("order_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!formData.customer_id,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const customer = customers?.find((c) => c.id === formData.customer_id);
      if (!customer) throw new Error("Customer not found");

      const { data: ticket, error: ticketError } = await supabase
        .from("customer_tickets")
        .insert({
          customer_id: formData.customer_id,
          customer_name: customer.customer_name,
          order_id: formData.order_id || null,
          issue_type: formData.issue_type,
          description: formData.description,
          priority: formData.priority,
          contact_info: customer.contact_info,
          assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
          internal_notes: formData.internal_notes || null,
          ticket_id: "", // auto by trigger
        } as any)
        .select()
        .single();

      if (ticketError) throw ticketError;

      const { error: issueError } = await supabase
        .from("customer_issues")
        .insert({
          ticket_id: ticket.ticket_id,
          customer_id: formData.customer_id,
          order_id: formData.order_id || null,
          issue_type: formData.issue_type,
          description: formData.description,
          issue_id: "", // auto by trigger
        } as any);

      if (issueError) throw issueError;

      return ticket;
    },
    onSuccess: () => {
      toast.success("Ticket created successfully");
      queryClient.invalidateQueries({ queryKey: ["customer_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["customer_issues"] });
      setFormData({
        customer_id: "",
        order_id: "",
        issue_type: "",
        description: "",
        priority: "medium",
        assigned_to: "",
        internal_notes: "",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to create ticket: ${error.message}`);
    },
  });

  // Fetch tickets
  const { data: tickets } = useQuery({
    queryKey: ["customer_tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredTickets = tickets?.filter((ticket) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      ticket.ticket_id?.toLowerCase().includes(searchLower) ||
      ticket.customer_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search by Ticket ID or Customer Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Create Ticket</Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new customer service ticket.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, customer_id: value, order_id: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customer_name} — {customer.customer_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Order (Optional)</Label>
              <Select
                value={formData.order_id}
                onValueChange={(value) => setFormData({ ...formData, order_id: value })}
                disabled={!formData.customer_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {orders?.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_id} - {order.delivery_status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Issue Type</Label>
              <Select
                value={formData.issue_type}
                onValueChange={(value) => setFormData({ ...formData, issue_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Damaged product">Damaged product</SelectItem>
                  <SelectItem value="Wrong item">Wrong item</SelectItem>
                  <SelectItem value="Missing item">Missing item</SelectItem>
                  <SelectItem value="Late delivery">Late delivery</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the issue..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Assigned To (Optional)</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.first_name} {employee.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Internal Notes (Optional)</Label>
              <Textarea
                value={formData.internal_notes}
                onChange={(e) =>
                  setFormData({ ...formData, internal_notes: e.target.value })
                }
                placeholder="Internal notes for solving this issue..."
                rows={3}
              />
            </div>

            <Button
              onClick={() => createTicketMutation.mutate()}
              disabled={
                !formData.customer_id ||
                !formData.issue_type ||
                !formData.description ||
                createTicketMutation.isPending
              }
              className="w-full"
            >
              {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Ticket Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Issue Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Date Reported</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Internal Notes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets?.map((ticket) => (
              <TicketRow key={ticket.id} ticket={ticket} customers={customers} employees={employees} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TicketRow({ ticket, customers, employees }: any) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data: orders } = useQuery({
    queryKey: ["sales_orders_for_ticket", ticket.customer_id],
    queryFn: async () => {
      if (!ticket.customer_id) return [];
      const { data, error } = await supabase
        .from("sales_orders")
        .select("*")
        .eq("customer_id", ticket.customer_id)
        .order("order_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!ticket.customer_id,
  });

  // Fetch product name for this ticket's order
  const { data: productInfo } = useQuery({
    queryKey: ["product_for_ticket", ticket.order_id],
    queryFn: async () => {
      if (!ticket.order_id) return null;
      const { data: order, error: orderError } = await supabase
        .from("sales_orders")
        .select("product_id")
        .eq("id", ticket.order_id)
        .single();
      
      if (orderError || !order?.product_id) return null;

      const { data: item, error: itemError } = await supabase
        .from("items")
        .select("name")
        .eq("id", order.product_id)
        .single();
      
      if (itemError) return null;
      return item;
    },
    enabled: !!ticket.order_id,
  });

  const [formData, setFormData] = useState({
    customer_id: ticket.customer_id || "",
    order_id: ticket.order_id || "",
    issue_type: ticket.issue_type || "",
    description: ticket.description || "",
    priority: ticket.priority || "medium",
    assigned_to: ticket.assigned_to?.toString() || "",
    internal_notes: ticket.internal_notes || "",
  });

  const updateTicketMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("customer_tickets")
        .update({
          customer_id: formData.customer_id,
          order_id: formData.order_id || null,
          issue_type: formData.issue_type,
          description: formData.description,
          priority: formData.priority,
          assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
          internal_notes: formData.internal_notes || null,
        })
        .eq("ticket_id", ticket.ticket_id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket updated successfully");
      queryClient.invalidateQueries({ queryKey: ["customer_tickets"] });
      setEditOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update ticket: ${error.message}`);
    },
  });

  const customer = customers?.find((c: any) => c.id === ticket.customer_id);
  const assignedEmployee = employees?.find((e: any) => e.id === ticket.assigned_to);
  const isClosed = ticket.status === "closed";

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{ticket.ticket_id}</TableCell>
        <TableCell>{ticket.customer_name}</TableCell>
        <TableCell>
          {customer?.customer_id || "—"}
        </TableCell>
        <TableCell>{productInfo?.name || "—"}</TableCell>
        <TableCell>
          {orders?.find((o: any) => o.id === ticket.order_id)?.order_id || "—"}
        </TableCell>
        <TableCell>{ticket.issue_type}</TableCell>
        <TableCell>
          <Badge
            variant={
              ticket.priority === "high"
                ? "destructive"
                : ticket.priority === "medium"
                ? "default"
                : "secondary"
            }
          >
            {ticket.priority}
          </Badge>
        </TableCell>
        <TableCell>
          {new Date(ticket.created_at).toLocaleDateString()}
        </TableCell>
        <TableCell>
          {assignedEmployee 
            ? `${assignedEmployee.first_name} ${assignedEmployee.last_name}`
            : "—"
          }
        </TableCell>
        <TableCell className="max-w-xs truncate">{ticket.description}</TableCell>
        <TableCell className="max-w-xs truncate">{ticket.internal_notes || "—"}</TableCell>
        <TableCell>
          <Badge variant="outline">{ticket.status || "open"}</Badge>
        </TableCell>
        <TableCell className="space-x-2 whitespace-nowrap">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isClosed}>
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Ticket {ticket.ticket_id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, customer_id: value, order_id: "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.customer_name} — {customer.customer_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Order (Optional)</Label>
                  <Select
                    value={formData.order_id}
                    onValueChange={(value) => setFormData({ ...formData, order_id: value })}
                    disabled={!formData.customer_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders?.map((order: any) => (
                        <SelectItem key={order.id} value={order.id}>
                          {order.order_id} - {order.delivery_status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Issue Type</Label>
                  <Select
                    value={formData.issue_type}
                    onValueChange={(value) => setFormData({ ...formData, issue_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Damaged product">Damaged product</SelectItem>
                      <SelectItem value="Wrong item">Wrong item</SelectItem>
                      <SelectItem value="Missing item">Missing item</SelectItem>
                      <SelectItem value="Late delivery">Late delivery</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe the issue..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Assigned To (Optional)</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees?.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Internal Notes (Optional)</Label>
                  <Textarea
                    value={formData.internal_notes}
                    onChange={(e) =>
                      setFormData({ ...formData, internal_notes: e.target.value })
                    }
                    placeholder="Internal notes for solving this issue..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => updateTicketMutation.mutate()}
                  disabled={
                    !formData.customer_id ||
                    !formData.issue_type ||
                    !formData.description ||
                    updateTicketMutation.isPending
                  }
                  className="w-full"
                >
                  {updateTicketMutation.isPending ? "Updating..." : "Update Ticket"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <DeleteTicket ticketId={ticket.ticket_id} />
        </TableCell>
      </TableRow>
    </>
  );
}
