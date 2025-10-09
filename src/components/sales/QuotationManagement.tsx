import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import AddLeadForm from './AddLeadForm';
import EditLeadForm from './EditLeadForm';

const QuotationManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Fetch leads and quotations from the database
    const fetchData = async () => {
      const [leadsData, quotationsData] = await Promise.all([
        supabase.from('leads').select('*'),
        supabase.from('quotations').select('*'),
      ]);
      setLeads(leadsData.data || []);
      setQuotations(quotationsData.data || []);
    };

    fetchData();
  }, []);

  const handleConvertToQuotation = async (lead_id: number) => {
    const lead = leads.find((lead) => lead.lead_id === lead_id);
    if (lead) {
      // Generate Quotation ID (e.g., QT-01, QT-02)
      const currentQuotations = quotations.length;
      const quotationId = `QT-${(currentQuotations + 1).toString().padStart(2, '0')}`;

      // Calculate Total Amount (Quantity * Unit Price)
      const product = await supabase
        .from('items')
        .select('id, name, unit_price')
        .eq('id', lead.product_id)
        .single();
      const totalAmount = lead.available_stock * product?.unit_price;

      // Insert new quotation into the quotations table
      const { error } = await supabase.from('quotations').insert([
        {
          quotation_id: quotationId,
          lead_id: lead.lead_id,
          customer_name: lead.customer_name,
          product_name: product?.name,
          quantity: lead.available_stock,
          unit_price: product?.unit_price,
          total_amount: totalAmount,
          status: 'Draft',  // Default status is Draft
          assigned_to: lead.assigned_to,
        },
      ]);

      if (error) {
        toast({ title: 'Error', description: 'Failed to convert lead to quotation.', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Lead successfully converted to quotation.' });
        setQuotations([...quotations, { quotation_id: quotationId, ...lead, total_amount: totalAmount }]);
      }
    }
  };

  const formatQuotationId = (id: string) => `QT-${id}`;

  const handleApproveOrReject = async (quotation_id: string, action: 'approve' | 'reject') => {
    const { error } = await supabase
      .from('quotations')
      .update({ status: action === 'approve' ? 'Approved' : 'Rejected' })
      .eq('quotation_id', quotation_id);

    if (error) {
      toast({ title: 'Error', description: `Failed to ${action} quotation.`, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Quotation has been ${action}d.` });
      setQuotations(quotations.map((q) => (q.quotation_id === quotation_id ? { ...q, status: action === 'approve' ? 'Approved' : 'Rejected' } : q)));
    }
  };

  const handleDeleteQuotation = async (quotation_id: string) => {
    const { error } = await supabase.from('quotations').delete().eq('quotation_id', quotation_id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete quotation.', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Quotation successfully deleted.' });
      setQuotations(quotations.filter((quotation) => quotation.quotation_id !== quotation_id));
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Quotation Management</CardTitle>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations
                .filter((quotation) => quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((quotation) => (
                  <TableRow key={quotation.quotation_id}>
                    <TableCell>{formatQuotationId(quotation.quotation_id)}</TableCell>
                    <TableCell>{quotation.customer_name}</TableCell>
                    <TableCell>{quotation.product_name}</TableCell>
                    <TableCell>{quotation.quantity}</TableCell>
                    <TableCell>{quotation.unit_price}</TableCell>
                    <TableCell>{quotation.total_amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{quotation.status}</Badge>
                    </TableCell>
                    <TableCell>{quotation.assigned_to}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveOrReject(quotation.quotation_id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveOrReject(quotation.quotation_id, 'reject')}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuotation(quotation.quotation_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              {quotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No quotations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuotationManagement;
