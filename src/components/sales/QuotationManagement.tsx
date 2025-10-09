import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { Product, Employee, Quotation } from '@/types/leads';

const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotationsData, productsData, employeesData] = await Promise.all([
        supabase.from('quotations').select('*').order('created_at', { ascending: false }),
        supabase.from('items').select('id, name, unit_price'),
        supabase.from('employees').select('id, first_name, last_name'),
      ]);

      setQuotations(quotationsData.data || []);
      setProducts(productsData.data || []);
      setEmployees(employeesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load quotations',
        variant: 'destructive',
      });
    }
  };

  const formatQuotationId = (id: number) => `QT-${id.toString().padStart(2, '0')}`;
  const formatLeadId = (id: number) => `LD-${id.toString().padStart(2, '0')}`;

  const handleApproveOrReject = async (quotation_id: number, action: 'approve' | 'reject') => {
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    
    const { error } = await supabase
      .from('quotations')
      .update({ status: newStatus })
      .eq('quotation_id', quotation_id);

    if (error) {
      toast({ 
        title: 'Error', 
        description: `Failed to ${action} quotation.`, 
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: 'Success', 
        description: `Quotation has been ${action}d.` 
      });
      
      setQuotations(
        quotations.map((q) => 
          q.quotation_id === quotation_id 
            ? { ...q, status: newStatus } 
            : q
        )
      );
    }
  };

  const handleDeleteQuotation = async (quotation_id: number) => {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('quotation_id', quotation_id);
      
    if (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete quotation.', 
        variant: 'destructive' 
      });
    } else {
      toast({ 
        title: 'Deleted', 
        description: 'Quotation successfully deleted.' 
      });
      setQuotations(quotations.filter((quotation) => quotation.quotation_id !== quotation_id));
    }
  };

  const filteredQuotations = quotations.filter((quotation) =>
    quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                <TableHead>Lead ID</TableHead>
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
              {filteredQuotations.map((quotation) => {
                const product = products.find((p) => p.id === quotation.product_id);
                const employee = employees.find((e) => e.id === quotation.assigned_to);
                
                return (
                  <TableRow key={quotation.quotation_id}>
                    <TableCell>{formatQuotationId(quotation.quotation_id)}</TableCell>
                    <TableCell>{formatLeadId(quotation.lead_id)}</TableCell>
                    <TableCell>{quotation.customer_name}</TableCell>
                    <TableCell>{product?.name || 'N/A'}</TableCell>
                    <TableCell>{quotation.quantity}</TableCell>
                    <TableCell>₱{quotation.unit_price?.toFixed(2)}</TableCell>
                    <TableCell>₱{quotation.total_amount?.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          quotation.status === 'Approved' 
                            ? 'default' 
                            : quotation.status === 'Rejected' 
                            ? 'destructive' 
                            : 'outline'
                        }
                      >
                        {quotation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee 
                        ? `${employee.first_name} ${employee.last_name}` 
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {quotation.status === 'Pending' && (
                          <>
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
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuotation(quotation.quotation_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredQuotations.length === 0 && (
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
