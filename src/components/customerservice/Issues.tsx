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
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

import type { Database } from '@/integrations/supabase/types';

type TicketTable = Database['public']['Tables']['customer_tickets']['Row'];

type IssueRow = {
  id: string; // e.g., IS-01
  ticket_id: string;
  order_id: string | null; // e.g., OD-01
  issue_type: string;
  description: string;
  date_reported: string;
};

const ISSUE_TYPES = ['Broken Item', 'Missing Item', 'Lost Package'];

export default function Issue() {
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<IssueRow>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchIssues();
  }, []);

  async function fetchIssues() {
    try {
      const { data, error } = await supabase
        .from('customer_tickets')
        .select('ticket_id, order_id, issue_type, description, date_reported')
        .order('date_reported', { ascending: true });

      if (error) throw error;

      const mapped: IssueRow[] = (data || []).map((row, idx) => {
        const issueId = `IS-${String(idx + 1).padStart(2, '0')}`;
        const orderFormatted = row.order_id
          ? `OD-${String(idx + 1).padStart(2, '0')}`
          : null;

        return {
          id: issueId,
          ticket_id: row.ticket_id,
          order_id: orderFormatted,
          issue_type: row.issue_type,
          description: row.description,
          date_reported: row.date_reported,
        };
      });

      setIssues(mapped);
    } catch (err: any) {
      toast.error('Failed to load issues: ' + err.message);
    }
  }

  function onEditClick(index: number) {
    setEditingIndex(index);
    setEditForm({ ...issues[index] });
  }

  function handleEditChange<K extends keyof IssueRow>(field: K, value: IssueRow[K]) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditForm({});
  }

  async function saveEdit() {
    if (editingIndex === null) return;

    const issue = issues[editingIndex];
    const updated = { ...issue, ...editForm } as IssueRow;

    try {
      const { error } = await supabase
        .from('customer_tickets')
        .update({
          issue_type: updated.issue_type,
          description: updated.description,
        })
        .eq('ticket_id', updated.ticket_id);

      if (error) throw error;

      toast.success(`Issue ${updated.id} updated`);
      setEditingIndex(null);
      fetchIssues();
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    }
  }

  const filteredIssues = issues.filter((issue) => {
    const q = searchQuery.toLowerCase();
    return (
      issue.id.toLowerCase().includes(q) ||
      issue.ticket_id.toLowerCase().includes(q) ||
      (issue.order_id?.toLowerCase().includes(q) ?? false) ||
      issue.issue_type.toLowerCase().includes(q) ||
      issue.description.toLowerCase().includes(q) ||
      format(new Date(issue.date_reported), 'MM/dd/yyyy').includes(q)
    );
  });

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Issues</h3>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Issue ID</TableHead>
            <TableHead>Ticket ID</TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Issue Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date Reported</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredIssues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500">
                No issues found.
              </TableCell>
            </TableRow>
          ) : (
            filteredIssues.map((issue, idx) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.id}</TableCell>
                <TableCell>{issue.ticket_id}</TableCell>
                <TableCell>{issue.order_id ?? '—'}</TableCell>

                <TableCell>
                  {editingIndex === idx ? (
                    <select
                      value={editForm.issue_type}
                      onChange={(e) => handleEditChange('issue_type', e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {ISSUE_TYPES.map((it) => (
                        <option key={it} value={it}>
                          {it}
                        </option>
                      ))}
                    </select>
                  ) : (
                    issue.issue_type
                  )}
                </TableCell>

                <TableCell>
                  {editingIndex === idx ? (
                    <Textarea
                      rows={2}
                      value={editForm.description}
                      onChange={(e) =>
                        handleEditChange('description', e.target.value)
                      }
                    />
                  ) : (
                    issue.description
                  )}
                </TableCell>

                <TableCell>
                  {issue.date_reported
                    ? format(new Date(issue.date_reported), 'MM/dd/yyyy')
                    : '—'}
                </TableCell>

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
