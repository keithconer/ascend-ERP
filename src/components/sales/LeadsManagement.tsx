import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AddLeadForm from './AddLeadForm';

// Define types
type Lead = {
  lead_id: number;
  customer_name: string;
  contact_info: string;
  product_id: string;
  available_stock: number;
  unit_price: number;
  lead_status: string;
  assigned_to: number;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  name: string;
  available_quantity: number;
  unit_price: number;
};

type Employee = {
  id: number;
  first_name: string;
  last_name: string;
};

const LeadsManagement: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch leads, products, and employees on component mount
  useEffect(() => {
    // Fetch leads from the database
    const fetchLeads = async () => {
      const { data, error } = await supabase.from('leads').select('*');
      if (error) {
        console.error('Error fetching leads:', error);
      } else {
        setLeads(data);
      }
    };

    // Fetch products from the inventory table
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('items') // Fetch from items table for product names
        .select('id, name, unit_price'); // Make sure to select the necessary columns
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data);
      }
    };

    // Fetch employees from the employees table
    const fetchEmployees = async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name');
      if (error) {
        console.error('Error fetching employees:', error);
      } else {
        setEmployees(data);
      }
    };

    fetchLeads();
    fetchProducts();
    fetchEmployees();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Delete a lead from the database
  const handleDeleteLead = async (lead_id: number) => {
    const { error } = await supabase.from('leads').delete().eq('lead_id', lead_id);
    if (error) {
      console.error('Error deleting lead:', error);
    } else {
      setLeads(leads.filter((lead) => lead.lead_id !== lead_id));
    }
  };

  // Handle converting lead to quotation
  const handleConvertToQuotation = (lead_id: number) => {
    console.log(`Lead ${lead_id} converted to quotation.`);
    // Additional logic to convert the lead to a quotation if necessary
  };

  // Handle real-time updates when a lead is added
  const handleAddLead = (newLead: Lead) => {
    setLeads([newLead, ...leads]);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Leads Management</h1>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded-md mb-6 hover:bg-blue-700 focus:outline-none"
        onClick={openModal}
      >
        Add New Lead
      </button>

      {/* Modal for Adding New Lead */}
      {isModalOpen && (
        <AddLeadForm
          onClose={closeModal}
          products={products}
          employees={employees}
          onLeadAdded={handleAddLead}
        />
      )}

      {/* Leads Table */}
      <div>
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-blue-100 text-left">
              <th className="py-3 px-4">Lead ID</th>
              <th className="py-3 px-4">Customer Name</th>
              <th className="py-3 px-4">Contact Info</th>
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Available Stock</th>
              <th className="py-3 px-4">Unit Price</th>
              <th className="py-3 px-4">Lead Status</th>
              <th className="py-3 px-4">Assigned To</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.lead_id} className="border-t">
                <td className="py-3 px-4">{lead.lead_id}</td>
                <td className="py-3 px-4">{lead.customer_name}</td>
                <td className="py-3 px-4">{lead.contact_info}</td>
                <td className="py-3 px-4">
                  {products.find((product) => product.id === lead.product_id)?.name}
                </td>
                <td className="py-3 px-4">
                  {products.find((product) => product.id === lead.product_id)?.available_quantity}
                </td>
                <td className="py-3 px-4">
                  {products.find((product) => product.id === lead.product_id)?.unit_price}
                </td>
                <td className="py-3 px-4">{lead.lead_status}</td>
                <td className="py-3 px-4">
                  {employees.find((emp) => emp.id === lead.assigned_to)?.first_name}
                </td>
                <td className="py-3 px-4 space-x-2">
                  <button
                    className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 focus:outline-none"
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none"
                    onClick={() => handleDeleteLead(lead.lead_id)}
                  >
                    Delete
                  </button>
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none"
                    onClick={() => handleConvertToQuotation(lead.lead_id)}
                  >
                    Convert to Quotation
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadsManagement;
