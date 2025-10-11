'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

import EditTicket from './EditTicket';
import DeleteTicket from './DeleteTicket';

import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type Employee = Database['public']['Tables']['employees']['Row'] & {
  departments?: { name: string } | null;
};
type SalesOrderWithItemName = Database['public']['Tables']['sales_orders']['Row'] & {
  items?: { name: string } | null;
};
type TicketRow = Database['public']['Tables']['customer_tickets']['Row'] & {
  customers?: { customer_id: string; customer_name: string };
  sales_orders?: { order_id: string; items: { name: string } | null };
  employees?: { first_name: string; last_name: string };
};

const ISSUE_TYPES = ['Broken Item', 'Missing Item', 'Lost Package'];
const PRIORITY_LEVELS = ['Low', 'Medium', 'High'];

export default function Ticket() {
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<SalesOrderWithItemName[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);

  // UI states
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingTicket, setEditingTicket] = useState<TicketRow | null>(null);
  const [deletingTicket, setDeletingTicket] = useState<TicketRow | null>(null);

  // Form state
  const [form, setForm] = useState({
    customer_id: '',
    order_id: '',
    issue_type: '',
    description: '',
    priority_level: '',
    assigned_to: '',
    internal_notes: '',
    solution: '',
  });

  useEffect(() => {
    loadDropdownData();
    loadTickets();
  }, []);

  async function loadDropdownData() {
    try {
      const [custRes, empRes] = await Promise.all([
        supabase.from('customers').select('id, customer_id, customer_name'),
        supabase
          .from('employees')
          .select('id, first_name, last_name, departments(name)')
          .eq('departments.name', 'Customer'),
      ]);

      if (custRes.error) throw custRes.error;
      if (empRes.error) throw empRes.error;

      setCustomers(custRes.data ?? []);
      setEmployees(empRes.data ?? []);
    } catch (error: any) {
      toast.error(`Error loading dropdown data: ${error.message}`);
    }
  }

  async function loadOrders(customerId: string) {
    if (!customerId) {
      setOrders([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('sales_orders')
        .select('id, order_id, items(name)')
        .eq('customer_id', customerId);

      if (error) throw error;
      setOrders(data ?? []);
    } catch {
      toast.error('Failed to load orders for selected customer');
    }
  }

  async function loadTickets() {
    try {
      const { data, error } = await supabase
        .from('customer_tickets')
        .select(`
          *,
          customers:customer_id (customer_id, customer_name),
          sales_orders:order_id (order_id, items(name)),
          employees:assigned_to (first_name, last_name)
        `)
        .order('date_reported', { ascending: false });

      if (error) throw error;

      // Remove duplicates by ticket id if any
      const uniqueTicketsMap = new Map<number, TicketRow>();
      data?.forEach((ticket) => {
        if (!uniqueTicketsMap.has(ticket.id)) {
          uniqueTicketsMap.set(ticket.id, ticket);
        }
      });

      setTickets(Array.from(uniqueTicketsMap.values()));
    } catch {
      toast.error('Failed to load tickets');
    }
  }

  async function generateNextTicketId(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('customer_tickets')
        .select('ticket_id')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data || data.length === 0 || !data[0].ticket_id) {
        return 'TD-01';
      }

      const lastId = data[0].ticket_id;
      const match = lastId.match(/TD-(\d+)/);
      const lastNumber = match ? parseInt(match[1], 10) : 0;
      return `TD-${String(lastNumber + 1).padStart(2, '0')}`;
    } catch {
      return 'TD-01';
    }
  }

  function onCustomerChange(id: string) {
    setForm((prev) => ({ ...prev, customer_id: id, order_id: '' }));
    loadOrders(id);
  }

  function onOrderChange(id: string) {
    setForm((prev) => ({ ...prev, order_id: id }));
  }

  function resetForm() {
    setForm({
      customer_id: '',
      order_id: '',
      issue_type: '',
      description: '',
      priority_level: '',
      assigned_to: '',
      internal_notes: '',
      solution: '',
    });
  }

  async function onSubmit() {
    if (!form.customer_id.trim() || !form.issue_type.trim()) {
      toast.warning('Customer and Issue Type are required');
      return;
    }

    try {
      const ticket_id = await generateNextTicketId();

      const { error } = await supabase
        .from('customer_tickets')
        .insert([
          {
            ticket_id,
            customer_id: form.customer_id,
            order_id: form.order_id || null,
            issue_type: form.issue_type,
            description: form.description,
            priority_level: form.priority_level,
            assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
            internal_notes: form.internal_notes,
            solution: form.solution || '-',
          },
        ]);

      if (error) throw error;

      toast.success(`Ticket ${ticket_id} created`);

      resetForm();
      setShowForm(false);
      await loadTickets();
    } catch (error: any) {
      toast.error(`Failed to submit ticket: ${error.message}`);
    }
  }

  // Filter tickets based on search term (case-insensitive, checks ticket_id, customer_name, issue_type)
  const filteredTickets = useMemo(() => {
    if (!searchTerm.trim()) return tickets;

    const lowerSearch = searchTerm.toLowerCase();

    return tickets.filter((ticket) => {
      return (
        ticket.ticket_id.toLowerCase().includes(lowerSearch) ||
        ticket.customers?.customer_name.toLowerCase().includes(lowerSearch) ||
        ticket.issue_type.toLowerCase().includes(lowerSearch)
      );
    });
  }, [searchTerm, tickets]);

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Customer Tickets</h3>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create Ticket'}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by Ticket ID, Customer Name, Issue Type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Ticket Form */}
      {showForm && (
        <div className="p-4 border rounded-md shadow-sm bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <div>
              <label className="block text-sm font-medium mb-1">Customer</label>
              <select
                value={form.customer_id}
                onChange={(e) => onCustomerChange(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customer_name} ({c.customer_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Order */}
            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <select
                value={form.order_id}
                onChange={(e) => onOrderChange(e.target.value)}
                className="w-full border rounded px-3 py-2"
                disabled={orders.length === 0}
              >
                <option value="">Select Order</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.order_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-sm font-medium mb-1">Issue Type</label>
              <select
                value={form.issue_type}
                onChange={(e) => setForm((f) => ({ ...f, issue_type: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Issue Type</option>
                {ISSUE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Level */}
            <div>
              <label className="block text-sm font-medium mb-1">Priority Level</label>
              <select
                value={form.priority_level}
                onChange={(e) => setForm((f) => ({ ...f, priority_level: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Priority</option>
                {PRIORITY_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium mb-1">Assign To</label>
              <select
                value={form.assigned_to}
                onChange={(e) => setForm((f) => ({ ...f, assigned_to: e.target.value }))}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id.toString()}>
                    {emp.first_name} {emp.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Solution */}
            <div>
              <label className="block text-sm font-medium mb-1">Solution</label>
              <Textarea
                rows={2}
                value={form.solution}
                onChange={(e) => setForm((f) => ({ ...f, solution: e.target.value }))}
              />
            </div>

            {/* Description (full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Internal Notes (full width) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Internal Notes</label>
              <Textarea
                rows={2}
                value={form.internal_notes}
                onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))}
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex justify-end">
              <Button onClick={onSubmit}>Submit Ticket</Button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="overflow-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Issue Type</TableHead>
              <TableHead>Solution</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date Reported</TableHead>
              <TableHead>Track Status</TableHead>
              <TableHead>Priority Level</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Internal Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-4 text-gray-500">
                  No tickets found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.ticket_id}</TableCell>
                  <TableCell>{ticket.customers?.customer_id ?? '—'}</TableCell>
                  <TableCell>{ticket.customers?.customer_name ?? '—'}</TableCell>
                  <TableCell>{ticket.sales_orders?.order_id ?? '—'}</TableCell>
                  <TableCell>{ticket.sales_orders?.items?.name ?? '—'}</TableCell>
                  <TableCell>{ticket.issue_type}</TableCell>
                  <TableCell>{ticket.solution ?? '-'}</TableCell>
                  <TableCell>{ticket.description}</TableCell>
                  <TableCell>
                    {ticket.date_reported
                      ? format(new Date(ticket.date_reported), 'MM/dd/yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell>{ticket.track_status ?? '—'}</TableCell>
                  <TableCell>{ticket.priority_level}</TableCell>
                  <TableCell>
                    {ticket.employees
                      ? `${ticket.employees.first_name} ${ticket.employees.last_name}`
                      : '—'}
                  </TableCell>
                  <TableCell>{ticket.internal_notes}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingTicket(ticket)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeletingTicket(ticket)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Modal */}
      {editingTicket && (
        <EditTicket
          ticket={editingTicket}
          customers={customers}
          employees={employees}
          orders={orders}
          onClose={() => setEditingTicket(null)}
          onUpdated={() => {
            setEditingTicket(null);
            loadTickets();
          }}
        />
      )}

      {/* Delete Modal */}
      {deletingTicket && (
        <DeleteTicket
          ticket={deletingTicket}
          onClose={() => setDeletingTicket(null)}
          onDeleted={() => {
            setDeletingTicket(null);
            loadTickets();
          }}
        />
      )}
    </div>
  );
}
