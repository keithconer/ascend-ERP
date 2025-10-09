import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Lead, Product, Employee, LeadStatus } from '@/types/leads';

type EditLeadFormProps = {
  lead: Lead;
  onLeadUpdated: (updatedLead: Lead) => void;
  closeModal: () => void;
  products: Product[];
  employees: Employee[];
};

const EditLeadForm: React.FC<EditLeadFormProps> = ({
  lead,
  onLeadUpdated,
  closeModal,
  products,
  employees,
}) => {
  const [customerName, setCustomerName] = useState(lead.customer_name);
  const [contactInfo, setContactInfo] = useState(lead.contact_info);
  const [productId, setProductId] = useState(lead.product_id);
  const [leadStatus, setLeadStatus] = useState<LeadStatus>(lead.lead_status);
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to.toString());
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !contactInfo || !productId || !assignedTo) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          customer_name: customerName,
          contact_info: contactInfo,
          product_id: productId,
          lead_status: leadStatus,
          assigned_to: parseInt(assignedTo),
        })
        .eq('lead_id', lead.lead_id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead updated successfully!',
      });

      onLeadUpdated(data);
      closeModal();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customerName">Customer Name</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter customer name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactInfo">Contact Info (Phone)</Label>
        <Input
          id="contactInfo"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          maxLength={11}
          placeholder="Enter contact number"
          pattern="^\d{11}$"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="productId">Product</Label>
        <Select value={productId} onValueChange={setProductId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="leadStatus">Lead Status</Label>
        <Select value={leadStatus} onValueChange={(value) => setLeadStatus(value as LeadStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedTo">Assigned To</Label>
        <Select value={assignedTo} onValueChange={setAssignedTo} required>
          <SelectTrigger>
            <SelectValue placeholder="Select an employee" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id.toString()}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button type="button" variant="outline" onClick={closeModal} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default EditLeadForm;
