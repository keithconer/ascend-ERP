import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Package } from 'lucide-react';
import type { Product, Employee, LeadStatus } from '@/types/leads';
import { Badge } from '@/components/ui/badge';

type AddLeadFormProps = {
  onLeadAdded: (newLead: any) => void;
  closeModal: () => void;
  products: Product[];
  employees: Employee[];
};

const AddLeadForm: React.FC<AddLeadFormProps> = ({
  onLeadAdded,
  closeModal,
  products,
  employees,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [productId, setProductId] = useState('');
  const [demandQuantity, setDemandQuantity] = useState<number>(1);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [leadStatus, setLeadStatus] = useState<LeadStatus>('new');
  const [assignedTo, setAssignedTo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (productId) {
      fetchAvailableStock(productId);
    }
  }, [productId]);

  const fetchAvailableStock = async (itemId: string) => {
    const { data, error } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('item_id', itemId);

    if (error) {
      console.error('Error fetching stock:', error);
      setAvailableStock(0);
      return;
    }

    const totalStock = data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    setAvailableStock(totalStock);
  };

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

    if (demandQuantity <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Demand quantity must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (demandQuantity > availableStock) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${availableStock} units available. Cannot fulfill demand of ${demandQuantity} units.`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([
          {
            customer_name: customerName,
            contact_info: contactInfo,
            product_id: productId,
            lead_status: leadStatus,
            assigned_to: parseInt(assignedTo),
            demand_quantity: demandQuantity,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead added successfully!',
      });

      onLeadAdded(data);
      closeModal();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lead',
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
        {productId && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Available Stock:</span>
            <Badge variant={availableStock > 0 ? "default" : "destructive"}>
              {availableStock} units
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="demandQuantity">Demand Quantity</Label>
        <Input
          id="demandQuantity"
          type="number"
          min="1"
          value={demandQuantity}
          onChange={(e) => setDemandQuantity(parseInt(e.target.value) || 1)}
          placeholder="Enter quantity needed"
          disabled={!productId}
          required
        />
        {productId && demandQuantity > availableStock && (
          <p className="text-sm text-destructive">
            Insufficient stock! Only {availableStock} units available.
          </p>
        )}
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
          {isLoading ? 'Saving...' : 'Save Lead'}
        </Button>
        <Button type="button" variant="outline" onClick={closeModal} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default AddLeadForm;
