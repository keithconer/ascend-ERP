// components/LeadsManagement.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import AddLeadForm from './AddLeadForm';
import EditLeadForm from './EditLeadForm';

const LeadsManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      const [leadsData, productsData, employeesData, inventoryData] = await Promise.all([
        supabase.from('leads').select('*'),
        supabase.from('items').select('id, name, unit_price'),
        supabase.from('employees').select('id, first_name, last_name'),
        supabase.from('inventory').select('item_id, available_quantity'),
      ]);
      setLeads(leadsData.data || []);
      setProducts(productsData.data || []);
      setEmployees(employeesData.data || []);
      setInventory(inventoryData.data || []);
    };

    fetchData();
  }, []);

  const handleLeadAdded = (newLead: any) => {
    setLeads((prevLeads) => [newLead, ...prevLeads]);
  };

  const handleLeadUpdated = (updatedLead: Lead) => {
    setLeads(leads.map((lead) => (lead.lead_id === updatedLead.lead_id ? updatedLead : lead)));
  };

  const handleDeleteLead = async (lead_id: number) => {
    const { error } = await supabase.from('leads').delete().eq('lead_id', lead_id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete lead.', variant: 'destructive' });
    } else {
      setLeads(leads.filter((lead) => lead.lead_id !== lead_id));
      toast({ title: 'Deleted', description: 'Lead successfully deleted.' });
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
              {leads
                .filter((lead) => lead.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((lead) => {
                  const product = products.find((product) => product.id === lead.product_id);
                  const productInventory = inventory.find((inv) => inv.item_id === lead.product_id);
                  return (
                    <TableRow key={lead.lead_id}>
                      <TableCell>{formatLeadId(lead.lead_id)}</TableCell>
                      <TableCell>{lead.customer_name}</TableCell>
                      <TableCell>{lead.contact_info}</TableCell>
                      <TableCell>{product?.name}</TableCell>
                      <TableCell>{productInventory?.available_quantity}</TableCell>
                      <TableCell>{product?.unit_price}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{lead.lead_status}</Badge>
                      </TableCell>
                      <TableCell>{employees.find((emp) => emp.id === lead.assigned_to)?.first_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(lead)}
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.lead_id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {leads.length === 0 && (
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

      {/* Modal for Adding New Lead */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-md bg-gray-100 p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <h3 className="text-xl font-semibold">Add New Lead</h3>
            <p className="text-sm text-muted-foreground">Fill in the details of the new lead below.</p>
          </DialogHeader>

          {/* Add Lead Form */}
          <AddLeadForm
            onClose={closeModal}
            products={products}
            employees={employees}
            inventory={inventory}
            onLeadAdded={handleLeadAdded}
          />
        </DialogContent>
      </Dialog>

      {/* Modal for Editing Lead */}
      <Dialog open={isEditModalOpen} onOpenChange={closeEditModal}>
        <DialogContent className="max-w-md bg-gray-100 p-6 rounded-lg shadow-lg">
          <DialogHeader>
            <h3 className="text-xl font-semibold">Edit Lead</h3>
            <p className="text-sm text-muted-foreground">Modify the details of the lead below.</p>
          </DialogHeader>

          {/* Edit Lead Form */}
          {selectedLead && (
            <EditLeadForm
              lead={selectedLead}
              onClose={closeEditModal}
              products={products}
              employees={employees}
              inventory={inventory}
              onLeadUpdated={handleLeadUpdated}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeadsManagement;
