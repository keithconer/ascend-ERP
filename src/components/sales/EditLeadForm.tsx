// components/EditLeadForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MdCheckCircle } from 'react-icons/md';

type EditLeadFormProps = {
  lead: Lead;
  onClose: () => void;
  products: { id: string; name: string; unit_price: number }[];
  employees: { id: number; first_name: string; last_name: string }[];
  onLeadUpdated: (updatedLead: Lead) => void;
  inventory: { item_id: string; available_quantity: number }[];
};

const EditLeadForm: React.FC<EditLeadFormProps> = ({
  lead,
  onClose,
  products,
  employees,
  onLeadUpdated,
  inventory,
}) => {
  const [customerName, setCustomerName] = useState(lead.customer_name);
  const [contactInfo, setContactInfo] = useState(lead.contact_info);
  const [productId, setProductId] = useState(lead.product_id);
  const [leadStatus, setLeadStatus] = useState<LeadStatus>(lead.lead_status);
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !contactInfo || !productId || !assignedTo) {
      setError('All fields are required');
      setSuccessMessage('');
      return;
    }

    setIsLoading(true);

    try {
      // Update the lead in the database
      const { error } = await supabase
        .from('leads')
        .update({
          customer_name: customerName,
          contact_info: contactInfo,
          product_id: productId,
          lead_status: leadStatus,
          assigned_to: assignedTo,
        })
        .eq('lead_id', lead.lead_id);

      setIsLoading(false);

      if (error) {
        setError('Error updating lead: ' + error.message);
        setSuccessMessage('');
      } else {
        setSuccessMessage('Lead updated successfully!');
        setError('');

        setTimeout(() => {
          setSuccessMessage('');
          onLeadUpdated({ ...lead, customer_name: customerName, contact_info: contactInfo, product_id: productId, lead_status: leadStatus, assigned_to: assignedTo });
          onClose();
        }, 2000);
      }
    } catch (error) {
      setIsLoading(false);
      setError('An unexpected error occurred: ' + error.message);
      setSuccessMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-5xl mx-auto">
      <h2 className="text-2xl mb-4 font-semibold">Edit Lead</h2>

      <div className="mb-4">
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-600">
          Customer Name
        </label>
        <input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
          type="text"
          placeholder="Enter customer name"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-600">
          Contact Info (Phone)
        </label>
        <input
          id="contactInfo"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          maxLength={11}
          className="w-full p-2 border border-gray-300 rounded-md"
          type="text"
          pattern="^\d{11}$"
          placeholder="Enter contact number"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="productId" className="block text-sm font-medium text-gray-600">
          Product
        </label>
        <select
          id="productId"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="leadStatus" className="block text-sm font-medium text-gray-600">
          Lead Status
        </label>
        <select
          id="leadStatus"
          value={leadStatus}
          onChange={(e) => setLeadStatus(e.target.value as LeadStatus)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="converted">Converted</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-600">
          Assigned To
        </label>
        <select
          id="assignedTo"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select an employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name}
            </option>
          ))}
        </select>
      </div>

      {/* Success Messages */}
      {successMessage && (
        <div className="bg-green-100 text-green-700 p-2 mt-4 rounded-md flex items-center">
          <MdCheckCircle className="text-lg mr-2" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Messages */}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin border-4 border-t-4 border-gray-300 rounded-full w-8 h-8"></div>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
};

export default EditLeadForm;
