import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type AddLeadFormProps = {
  onClose: () => void;
  products: { id: string; name: string; unit_price: number }[];
  employees: { id: number; first_name: string; last_name: string }[];
  onLeadAdded: (newLead: any) => void;
  inventory: { item_id: string; available_quantity: number }[];
};

const AddLeadForm: React.FC<AddLeadFormProps> = ({
  onClose,
  products,
  employees,
  onLeadAdded,
  inventory,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [productId, setProductId] = useState<string | number>('');
  const [leadStatus, setLeadStatus] = useState<'new' | 'qualified' | 'converted'>('new');
  const [assignedTo, setAssignedTo] = useState<string | number>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false); // For loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerName || !contactInfo || !productId || !assignedTo) {
      setError('All fields are required');
      setSuccessMessage('');
      return;
    }

    setIsLoading(true); // Start loading

    try {
      // Insert the lead into the Supabase database
      const { error } = await supabase.from('leads').insert([
        {
          customer_name: customerName,
          contact_info: contactInfo,
          product_id: productId,
          lead_status: leadStatus,
          assigned_to: assignedTo,
        },
      ]);

      setIsLoading(false); // Stop loading

      if (error) {
        setError('Error adding lead: ' + error.message);
        setSuccessMessage('');
      } else {
        setSuccessMessage('Lead added successfully!');
        setError(''); // Clear error if success

        // Wait for 2 seconds before closing the modal and updating the leads list
        setTimeout(() => {
          setSuccessMessage('');
          onLeadAdded({ customer_name: customerName, contact_info: contactInfo, product_id: productId, lead_status: leadStatus, assigned_to: assignedTo });
          onClose(); // Close the modal after successful addition
        }, 2000);
      }
    } catch (error) {
      setIsLoading(false); // Stop loading in case of error
      setError('An unexpected error occurred: ' + error.message);
      setSuccessMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-5xl mx-auto">
      <h2 className="text-2xl mb-4 font-semibold">Add New Lead</h2>

      {/* Input Fields */}
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
          onChange={(e) => setLeadStatus(e.target.value as 'new' | 'qualified' | 'converted')}
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
          <span className="material-icons text-lg mr-2">check_circle</span>
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
          {isLoading ? 'Saving...' : 'Save Lead'}
        </Button>
      </div>
    </form>
  );
};

export default AddLeadForm;
