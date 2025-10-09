// src/components/EditQuotationForm.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Quotation } from './QuotationManagement'; // Assuming Quotation type is exported

type EditQuotationFormProps = {
  quotation: Quotation;
  onClose: () => void;
  onQuotationUpdated: (updatedQuotation: Quotation) => void;
};

const EditQuotationForm: React.FC<EditQuotationFormProps> = ({
  quotation,
  onClose,
  onQuotationUpdated,
}) => {
  const [editedQuotation, setEditedQuotation] = useState<Quotation>(quotation);
  const { toast } = useToast();

  // Handle form changes
  const handleChange = (field: keyof Quotation, value: string | number) => {
    setEditedQuotation((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      // Here you would typically call an API or update the database
      // For this example, we'll just simulate the update
      onQuotationUpdated(editedQuotation);
      toast({ title: 'Quotation Updated', description: 'The quotation has been updated.' });
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update quotation.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="space-y-4">
        <div>
          <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
            Customer Name
          </label>
          <Input
            id="customer_name"
            value={editedQuotation.customer_name}
            onChange={(e) => handleChange('customer_name', e.target.value)}
            className="mt-1 block w-full"
          />
        </div>

        <div>
          <label htmlFor="product_name" className="block text-sm font-medium text-gray-700">
            Product
          </label>
          <Input
            id="product_name"
            value={editedQuotation.product_name}
            onChange={(e) => handleChange('product_name', e.target.value)}
            className="mt-1 block w-full"
          />
        </div>

        <div className="flex space-x-4">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <Input
              id="quantity"
              type="number"
              value={editedQuotation.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>

          <div>
            <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
              Unit Price
            </label>
            <Input
              id="unit_price"
              type="number"
              value={editedQuotation.unit_price}
              onChange={(e) => handleChange('unit_price', parseFloat(e.target.value))}
              className="mt-1 block w-full"
            />
          </div>
        </div>

        <div>
          <label htmlFor="total_amount" className="block text-sm font-medium text-gray-700">
            Total Amount
          </label>
          <Input
            id="total_amount"
            value={editedQuotation.total_amount}
            readOnly
            className="mt-1 block w-full bg-gray-200 cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <Select
            value={editedQuotation.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </Select>
        </div>

        <div>
          <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
            Assigned To
          </label>
          <Input
            id="assigned_to"
            value={editedQuotation.assigned_to}
            onChange={(e) => handleChange('assigned_to', e.target.value)}
            className="mt-1 block w-full"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit}>Save Changes</Button>
      </div>
    </div>
  );
};

export default EditQuotationForm;
