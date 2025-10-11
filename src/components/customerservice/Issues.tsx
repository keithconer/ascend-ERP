'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Issue = {
  id: string;
  issue_id: string;
  issue_type: string;
  description: string;
};

type IssueType = {
  type_name: string;
  description: string;
};

export default function Issues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [form, setForm] = useState({ issue_type: '', description: '', id: '' });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // changed from 10 to 7

  // Fetch all issue records
  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from('customer_issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) toast.error('Failed to fetch issues');
    else setIssues(data);
  };

  // Fetch predefined issue types from the DB
  const fetchIssueTypes = async () => {
    const { data, error } = await supabase
      .from('issue_types')
      .select('type_name, description')
      .order('type_name', { ascending: true });

    if (error) toast.error('Failed to fetch issue types');
    else setIssueTypes(data);
  };

  useEffect(() => {
    fetchIssues();
    fetchIssueTypes();
  }, []);

  // Reset to first page if issues or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, issues]);

  // Auto-populate description when issue type is selected
  const handleIssueTypeChange = (value: string) => {
    const selected = issueTypes.find((type) => type.type_name === value);
    const defaultDescription = selected?.description ?? '';

    setForm({
      issue_type: value,
      description: defaultDescription,
      id: '',
    });
  };

  // Create issue
  const handleSubmit = async () => {
    if (!form.issue_type) {
      toast.warning('Please select an issue type');
      return;
    }

    // Check if issue_type already exists (should be redundant with filtering but safety first)
    const { data: existingIssues, error: fetchError } = await supabase
      .from('customer_issues')
      .select('id')
      .eq('issue_type', form.issue_type)
      .limit(1);

    if (fetchError) {
      toast.error('Failed to validate issue type');
      return;
    }

    if (existingIssues && existingIssues.length > 0) {
      toast.error(`Issue type "${form.issue_type}" already exists.`);
      return;
    }

    const { error } = await supabase
      .from('customer_issues')
      .insert([
        {
          issue_type: form.issue_type,
          description: form.description,
        },
      ]);

    if (error) toast.error('Failed to create issue');
    else toast.success('Issue created');

    setForm({ issue_type: '', description: '', id: '' });
    setIsDialogOpen(false);
    fetchIssues();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('customer_issues').delete().eq('id', id);
    if (error) toast.error('Failed to delete issue');
    else {
      toast.success('Issue deleted');
      fetchIssues();
    }
  };

  // Filter out issueTypes that are already added to customer_issues
  const availableIssueTypes = useMemo(() => {
    const usedTypes = new Set(issues.map((issue) => issue.issue_type));
    return issueTypes.filter((type) => !usedTypes.has(type.type_name));
  }, [issueTypes, issues]);

  // Filter issues by search term (matches issue_id or issue_type, case insensitive)
  const filteredIssues = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.issue_id.toLowerCase().includes(lowerSearch) ||
        issue.issue_type.toLowerCase().includes(lowerSearch)
    );
  }, [search, issues]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const paginatedIssues = filteredIssues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Customer Issues</h2>
          <p className="text-sm text-muted-foreground">
            View and manage common customer complaints
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setForm({ issue_type: '', description: '', id: '' });
              }}
            >
              Create Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Issue</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Issue Type</Label>
                <Select
                  value={form.issue_type}
                  onValueChange={handleIssueTypeChange}
                >
                  <SelectTrigger>
                    {form.issue_type || 'Select Issue Type'}
                  </SelectTrigger>
                  <SelectContent>
                    {availableIssueTypes.length === 0 ? (
                      <SelectItem value="" disabled>
                        No available issue types
                      </SelectItem>
                    ) : (
                      availableIssueTypes.map((type) => (
                        <SelectItem key={type.type_name} value={type.type_name}>
                          {type.type_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe the issue..."
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={!form.issue_type}>
                  Create Issue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search input */}
      <div>
        <input
          type="text"
          placeholder="Search by Issue ID or Issue Type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-md"
        />
      </div>

      {/* Pagination controls at the top */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-2">
          <Button
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>

          {[...Array(totalPages)].map((_, idx) => {
            const pageNum = idx + 1;
            return (
              <Button
                key={pageNum}
                size="sm"
                variant={pageNum === currentPage ? 'default' : 'outline'}
                onClick={() => goToPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}

          <Button
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Table display */}
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 font-medium text-foreground">Issue ID</th>
              <th className="px-4 py-3 font-medium text-foreground">Issue Type</th>
              <th className="px-4 py-3 font-medium text-foreground">Description</th>
              <th className="px-4 py-3 font-medium text-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedIssues.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-muted-foreground">
                  No issues found.
                </td>
              </tr>
            ) : (
              paginatedIssues.map((issue) => (
                <tr key={issue.id} className="border-t">
                  <td className="px-4 py-2">{issue.issue_id}</td>
                  <td className="px-4 py-2">{issue.issue_type}</td>
                  <td className="px-4 py-2">{issue.description}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(issue.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
