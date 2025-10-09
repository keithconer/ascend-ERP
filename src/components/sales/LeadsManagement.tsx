import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import AddLeadForm from './AddLeadForm';
import EditLeadForm from './EditLeadForm';
import type { Lead, Product, Employee, Inventory, Quotation } from '@/types/leads';

const LeadsManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsData, productsData, employeesData, inventoryData, quotationsData] = await Promise.all([
        supabase.from('leads').select('*'),
        supabase.from('items').select('id, name, unit_price'),
        supabase.from('employees').select('id, first_name, last_name'),
        supabase.from('inventory').select('item_id, available_quantity'),
        supabase.from('quotations').select('*'),
      ]);

      setLeads(leadsData.data || []);
      setProducts(productsData.data || []);
      setEmployees(employeesData.data || []);
      setInventory(inventoryData.data || []);
      setQuotations(quotationsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    }
  };

  const handleLeadAdded = (newLead: Lead) => {
    setLeads((prevLeads) => [newLead, ...prevLeads]);
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads(leads.map((lead) => (lead.lead_id === updatedLead.lead_id ? updatedLead : lead)));
  };

  const handleDeleteLead = async (lead_id: number) => {
    const { error } = await supabase.from('leads').delete().eq('lead_id', lead_id);
    
    if (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to delete lead.', 
        variant: 'destructive' 
      });
    } else {
      setLeads(leads.filter((lead) => lead.lead_id !== lead_id));
      toast({ 
        title: 'Deleted', 
        description: 'Lead successfully deleted.' 
      });
    }
  };

  const handleConvertToQuotation = async (lead_id: number) => {
    const lead = leads.find((lead) => lead.lead_id === lead_id);
    if (!lead) {
      toast({
        title: 'Error',
        description: 'Lead not found. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find((product) => product.id === lead.product_id);
    const inventoryItem = inventory.find((item) => item.item_id === lead.product_id);

    if (!product) {
      toast({
        title: 'Error',
        description: 'Product not found. Please check the product details.',
        variant: 'destructive',
      });
      return;
    }

    if (!inventoryItem) {
      toast({
        title: 'Error',
        description: 'Inventory item not found. Please check the inventory details.',
        variant: 'destructive',
      });
      return;
    }

    const availableStock = lead.available_stock ?? inventoryItem.available_quantity;

    if (availableStock <= 0 || inventoryItem.available_quantity < availableStock) {
      toast({
        title: 'Error',
        description: 'Insufficient stock. Cannot convert to quotation.',
        variant: 'destructive',
      });
      return;
    }

    const totalAmount = product.unit_price * availableStock;

    const { error } = await supabase.from('quotations').insert([
      {
        lead_id: lead.lead_id,
        customer_name: lead.customer_name,
        product_id: product.id,
        quantity: availableStock,
        unit_price: product.unit_price,
        total_amount: totalAmount,
        status: 'Pending',
      },
    ]);

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to convert lead to quotation: ${error.message}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Lead has been successfully converted to a quotation.',
      });

      setLeads(leads.filter((lead) => lead.lead_id !== lead_id));

      const newQuotation = {
        quotation_id: `QT-${quotations.length + 1}`,
        lead_id: lead.lead_id,
        customer_name: lead.customer_name,
        product_id: product.id,
        quantity: availableStock,
        unit_price: product.unit_price,
        total_amount: totalAmount,
        status: 'Pending',
      };

      setQuotations([newQuotation, ...quotations]);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedLead(null);
    setIsEditModalOpen(false);
  };

  const formatLeadId = (id: number) => `LD-${id.toString().padStart(2, '0')}`;

  const filteredLeads = leads.filter((lead) =>
    lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Leads Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={openModal} className="ml-4">
              Add New Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead ID</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Available Stock</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const product = products.find((product) => product.id === lead.product_id);
                const inventoryItem = inventory.find((inv) => inv.item_id === lead.product_id);
                const employee = employees.find((emp) => emp.id === lead.assigned_to);
                return (
                  <TableRow key={lead.lead_id}>
                    <TableCell>{formatLeadId(lead.lead_id)}</TableCell>
                    <TableCell>{lead.customer_name}</TableCell>
                    <TableCell>{lead.contact_info}</TableCell>
                    <TableCell>{product?.name}</TableCell>
                    <TableCell>{inventoryItem?.available_quantity}</TableCell>
                    <TableCell>{product?.unit_price}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.lead_status}</Badge>
                    </TableCell>
                    <TableCell>
                      {employee?.first_name} {employee?.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(lead)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteLead(lead.lead_id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConvertToQuotation(lead.lead_id)}
                        >
                          Convert
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No leads found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <AddLeadForm
            onLeadAdded={handleLeadAdded}
            closeModal={closeModal}
            products={products}
            employees={employees}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <EditLeadForm
              lead={selectedLead}
              onLeadUpdated={handleLeadUpdated}
              closeModal={closeEditModal}
              products={products}
              employees={employees}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsManagement;
