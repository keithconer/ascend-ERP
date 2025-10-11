'use client';

import { useEffect, useState } from 'react';
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
import { format } from 'date-fns';

import type { Database } from '@/integrations/supabase/types';

type TicketRow = Database['public']['Tables']['customer_tickets']['Row'];
type Employee = Database['public']['Tables']['employees']['Row'];

type SolutionRow = {
  id: string;
  solution_id: string;
  ticket_id: string;
  order_id: string | null;
  issue_type: string;
  solution_choice: string;
  assigned_to: number | null;
  date_reported: string;
  resolution_status: string;
};

const SOLUTION_CHOICES = ['Replacement', 'Ship missing item', 'Refund'];

export default function Solutions() {
  const [solutions, setSolutions] = useState<SolutionRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<SolutionRow>>({});

  useEffect(() => {
    loadTickets();
    loadEmployees();
    loadSolutions();
  }, []);

  async function loadTickets() {
    const { data, error } = await supabase
      .from('customer_tickets')
      .select('ticket_id, order_id, issue_type, date_reported');
    if (error) {
      toast.error('Failed to load tickets: ' + error.message);
      return;
    }
    setTickets(data || []);
  }

  async function loadEmployees() {
    const { data, error } = await supabase
      .from('employees')
      .select('id, first_name, last_name');
    if (error) {
      toast.error('Failed to load employees: ' + error.message);
      return;
    }
    setEmployees(data || []);
  }

  async function loadSolutions() {
    try {
      const { data, error } = await supabase
        .from('solutions')
        .select('*')
        .order('date_reported', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((row, idx) => ({
        ...row,
        order_id: row.order_id ? `OD-${String(idx + 1).padStart(2, '0')}` : null,
      })) as SolutionRow[];

      setSolutions(mapped);
    } catch (err: any) {
      toast.error('Failed to load solutions: ' + err.message);
    }
  }

  async function generateNextSolutionId(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('solutions')
        .select('solution_id')
        .order('date_reported', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0 || !data[0].solution_id) {
        return 'SOL-01';
      }

      const last = data[0].solution_id;
      const match = last.match(/SOL-(\d+)/);
      const lastNum = match ? parseInt(match[1], 10) : 0;
      const nextNum = lastNum + 1;

      return `SOL-${String(nextNum).padStart(2, '0')}`;
    } catch {
      return 'SOL-01';
    }
  }

  async function ensureSolutionsMatchTickets() {
    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      const exists = solutions.find((s) => s.ticket_id === t.ticket_id);

      if (!exists) {
        const solId = await generateNextSolutionId();
        const formattedOrderId = t.order_id ? `OD-${String(i + 1).padStart(2, '0')}` : null;

        const insertObj = {
          solution_id: solId,
          ticket_id: t.ticket_id,
          order_id: formattedOrderId,
          issue_type: t.issue_type,
          solution_choice: '',
          assigned_to: null,
          date_reported: t.date_reported,
          resolution_status: 'pending',
        };

        const { error } = await supabase.from('solutions').insert([insertObj]);
        if (error) {
          toast.error('Failed to auto-create solution row: ' + error.message);
        }
      }
    }

    await loadSolutions();
  }

  useEffect(() => {
    if (tickets.length > 0) {
      ensureSolutionsMatchTickets();
    }
  }, [tickets]);

  function onEditClick(index: number) {
    setEditingIndex(index);
    setEditForm({ ...solutions[index] });
  }

  function handleEditChange<K extends keyof SolutionRow>(field: K, value: SolutionRow[K]) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (editingIndex === null) return;
    const sol = solutions[editingIndex];
    const updated = { ...sol, ...editForm } as SolutionRow;

    try {
      const { error } = await supabase
        .from('solutions')
        .update({
          solution_choice: updated.solution_choice,
          assigned_to: updated.assigned_to,
          resolution_status:
            updated.solution_choice && updated.solution_choice !== ''
              ? 'resolved'
              : 'pending',
        })
        .eq('solution_id', updated.solution_id);

      if (error) throw error;

      toast.success(`Solution ${updated.solution_id} updated`);
      setEditingIndex(null);
      loadSolutions();
    } catch (err: any) {
      toast.error('Failed to save solution: ' + err.message);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-xl font-semibold">Solutions</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Solution ID</TableHead>
            <TableHead>Issue / Ticket ID</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Issue Type</TableHead>
            <TableHead>Solution Choice</TableHead>
            <TableHead>Resolved By / Assigned To</TableHead>
            <TableHead>Date Reported</TableHead>
            <TableHead>Resolution Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {solutions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-gray-500">
                No solutions found.
              </TableCell>
            </TableRow>
          ) : (
            solutions.map((sol, idx) => (
              <TableRow key={sol.solution_id}>
                <TableCell>{sol.solution_id}</TableCell>
                <TableCell>{sol.ticket_id}</TableCell>
                <TableCell>{sol.order_id ?? '—'}</TableCell>
                <TableCell>{sol.issue_type}</TableCell>

                <TableCell>
                  {editingIndex === idx ? (
                    <select
                      value={editForm.solution_choice}
                      onChange={(e) => handleEditChange('solution_choice', e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="">-- Select --</option>
                      {SOLUTION_CHOICES.map((choice) => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))}
                    </select>
                  ) : (
                    sol.solution_choice || '—'
                  )}
                </TableCell>

                <TableCell>
                  {editingIndex === idx ? (
                    <select
                      value={editForm.assigned_to ?? ''}
                      onChange={(e) =>
                        handleEditChange('assigned_to', e.target.value ? Number(e.target.value) : null)
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="">Unassigned</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name}
                        </option>
                      ))}
                    </select>
                  ) : sol.assigned_to ? (
                    (() => {
                      const emp = employees.find((e) => e.id === sol.assigned_to);
                      return emp ? `${emp.first_name} ${emp.last_name}` : '—';
                    })()
                  ) : (
                    '—'
                  )}
                </TableCell>

                <TableCell>
                  {sol.date_reported
                    ? format(new Date(sol.date_reported), 'MM/dd/yyyy')
                    : '—'}
                </TableCell>

                <TableCell>{sol.resolution_status}</TableCell>

                <TableCell className="space-x-2">
                  {editingIndex === idx ? (
                    <>
                      <Button size="sm" onClick={saveEdit}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => onEditClick(idx)}>
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
