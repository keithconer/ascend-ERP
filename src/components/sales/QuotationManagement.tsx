// src/components/QuotationManagement.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Make sure supabase is set up
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import EditQuotationForm from './EditQuotationForm'; // This will be created later
import { format } from 'date-fns';

type Quotation = {
  quotation_id: string;
  lead_id: number;
  customer_name: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  assigned_to: string;
};

const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuotations = async () => {
      const { data, error } = await supabase.from('quotations').select(`
        quotation_id,
        lead_id,
        customer_name,
        product_name,
        quantity,
        unit_price,
        total_amount,
        status,
        assigned_to
      `);

      if (error) {
        console.log('Error fetching quotations:', error);
      } else {
        setQuotations(data || []);
      }
    };

    fetchQuotations();
  }, []);

  const formatQuotationId = (id: number) => `QT-${id.toString().padStart(2, '0')}`;

  const handleStatusUpdate = async (quotationId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('quotations')
      .update({ status: newStatus })
      .eq('quotation_id', quotationId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    } else {
      toast({ title: 'Status Updated', description: `Quotation status changed to ${newStatus}.` });
      setQuotations(
        quotations.map((quotation) =>
          quotation.quotation_id === quotationId ? { ...quotation, status: newStatus } : quotation
        )
      );
    }
  };

  const handleConvertToSalesOrder = async (quotationId: string) => {
    // Convert to sales order logic (to be implemented later)
    toast({ title: 'Converted', description: 'Quotation has been converted to Sales Order.' });
  };

  const handleDeleteQuotation = async (quotationId: string) => {
    const { error } = await supabase.from('quotations').delete().eq('quotation_id', quotationId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete quotation.', variant: 'destructive' });
    } else {
      setQuotations(quotations.filter((quotation) => quotation.quotation_id !== quotationId));
      toast({ title: 'Deleted', description: 'Quotation successfully deleted.' });
    }
  };

  const openEditModal = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedQuotation(null);
    setIsEditModalOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Quotation Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Input
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
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
                .filter((quotation) =>
                  quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((quotation) => (
                  <TableRow key={quotation.quotation_id}>
                    <TableCell>{quotation.quotation_id}</TableCell>
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
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(quotation)}>
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuotation(quotation.quotation_id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                        {quotation.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(quotation.quotation_id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        {quotation.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConvertToSalesOrder(quotation.quotation_id)}
                          >
                            <ArrowRight className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {quotation.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(quotation.quotation_id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
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

      {/* Modal for Editing Quotation */}
      <Dialog open={isEditModalOpen} onOpenChange={closeEditModal}>
        <DialogContent className="max-w-md bg-gray-100 p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <h3 className="text-xl font-semibold">Edit Quotation</h3>
          </DialogHeader>

          {/* Edit Quotation Form */}
          {selectedQuotation && (
            <EditQuotationForm
              quotation={selectedQuotation}
              onClose={closeEditModal}
              onQuotationUpdated={(updatedQuotation) => {
                setQuotations(
                  quotations.map((quotation) =>
                    quotation.quotation_id === updatedQuotation.quotation_id
                      ? updatedQuotation
                      : quotation
                  )
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationManagement;
