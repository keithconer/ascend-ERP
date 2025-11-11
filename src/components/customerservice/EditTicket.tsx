'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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

type EditTicketProps = {
  ticket: TicketRow;
  customers: Customer[];
  employees: Employee[];
  orders: SalesOrderWithItemName[];
  onClose: () => void;
  onUpdated: () => void;
};

const ISSUE_TYPES = ['Broken Item', 'Missing Item', 'Lost Package'];
const PRIORITY_LEVELS = ['Low', 'Medium', 'High'];

export default function EditTicket({
  ticket,
  customers,
  employees,
  orders,
  onClose,
  onUpdated,
}: EditTicketProps) {
  const [form, setForm] = useState({
    customer_id: ticket.customer_id ?? '',
    order_id: ticket.order_id ?? '',
    issue_type: ticket.issue_type ?? '',
    description: ticket.description ?? '',
    priority: ticket.priority ?? 'medium',
    assigned_to: ticket.assigned_to?.toString() ?? '',
    internal_notes: ticket.internal_notes ?? '',
    solution: ticket.solution ?? '',
  });

  useEffect(() => {
    // If customer changes, orders might change — 
    // optionally reload orders or expect parent to handle
  }, [form.customer_id]);

  async function onSubmit() {
    if (!form.customer_id.trim() || !form.issue_type.trim()) {
      toast.warning('Customer and Issue Type are required');
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_tickets')
        .update({
          customer_id: form.customer_id,
          order_id: form.order_id || null,
          issue_type: form.issue_type,
          description: form.description,
          priority: form.priority,
          assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
          internal_notes: form.internal_notes,
          solution: form.solution || '-',
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast.success(`Ticket ${ticket.ticket_id} updated`);
      onUpdated();
    } catch (error: any) {
      toast.error(`Failed to update ticket: ${error.message}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-md max-w-xl w-full max-h-full overflow-auto">
        <h3 className="text-lg font-semibold mb-4">Edit Ticket {ticket.ticket_id}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer */}
          <div>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <select
              value={form.customer_id}
              onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
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
              onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value }))}
              className="w-full border rounded px-3 py-2"
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
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Priority</option>
              {PRIORITY_LEVELS.map((level) => (
                <option key={level.toLowerCase()} value={level.toLowerCase()}>
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

          {/* Buttons */}
          <div className="md:col-span-2 flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>Update Ticket</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
