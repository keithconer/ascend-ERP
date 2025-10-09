import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AddLeadFormProps = {
  onClose: () => void;
  products: { id: string; name: string }[];
  employees: { id: number; first_name: string; last_name: string }[];
};

const AddLeadForm: React.FC<AddLeadFormProps> = ({ onClose, products, employees }) => {
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [productId, setProductId] = useState<string | number>('');
  const [leadStatus, setLeadStatus] = useState<'new' | 'qualified' | 'converted'>('new');
  const [assignedTo, setAssignedTo] = useState<string | number>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !contactInfo || !productId || !assignedTo) {
      setError('All fields are required');
      return;
    }

    // Insert new lead into database
    const { error } = await supabase.from('leads').insert([
      {
        customer_name: customerName,
        contact_info: contactInfo,
        product_id: productId,
        lead_status: leadStatus,
        assigned_to: assignedTo,
      },
    ]);

    if (error) {
      setError('Error adding lead: ' + error.message);
    } else {
      onClose();
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl mb-4">Add New Lead</h2>
        <div className="mb-4">
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-600">Customer Name</label>
          <input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            type="text"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-600">Contact Info</label>
          <input
            id="contactInfo"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            maxLength={11}
            className="w-full p-2 border border-gray-300 rounded-md"
            type="text"
            pattern="^\d{11}$"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="productId" className="block text-sm font-medium text-gray-600">Product</label>
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
          <label htmlFor="leadStatus" className="block text-sm font-medium text-gray-600">Lead Status</label>
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
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-600">Assigned To</label>
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

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 text-white px-4 py-2 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddLeadForm;
