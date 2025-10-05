import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AccountsPayable = () => {
  const [payableData, setPayableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchAccountsPayable() {
      setLoading(true);
      console.log('Fetching accounts payable data...');

      // Fetch pending Purchase Orders (POs) from 'purchase_orders' table
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')  // Correct table for purchase orders
        .select(`
          id,
          po_number,
          supplier_id,
          status,
          amount,
          suppliers(name)  // Correct join to get supplier name
        `)
        .eq('status', 'pending');  // Correct 'pending' status

      // Handle errors fetching POs
      if (poError) {
        console.error('Error fetching Pending Purchase Orders:', poError.message);
      } else {
        console.log('Fetched Pending POs:', poData);
      }

      // Fetch unreleased payrolls from 'payroll' table
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')  // Correct table for payroll data
        .select(`
          id,
          first_name,
          last_name,
          salary,
          status
        `)
        .eq('status', 'Unreleased');  // Fetch only Unreleased payrolls

      // Handle errors fetching payrolls
      if (payrollError) {
        console.error('Error fetching Unreleased Payrolls:', payrollError.message);
      } else {
        console.log('Fetched Unreleased Payrolls:', payrollData);
      }

      // Combine both PO data and unreleased payroll data into one structure
      const combinedData = [
        ...(poData || []).map(po => ({
          type: 'PO',
          invoice_id: po.po_number,  // PO Number
          supplier_name: po.suppliers?.name ?? 'Unknown Supplier',  // Supplier name from joined data
          po_number: po.po_number,  // PO Number
          amount: po.amount,  // Assuming there's an 'amount' column for POs
          status: po.status,  // PO Status
        })),
        ...(payrollData || []).map(payroll => ({
          type: 'Payroll',
          invoice_id: payroll.id,  // Payroll ID
          employee_name: `${payroll.first_name} ${payroll.last_name}`,  // Employee Name
          total_salary: payroll.salary,  // Total Salary
          status: payroll.status,  // Payroll Status
        }))
      ];

      // Set the state with the combined data
      setPayableData(combinedData);
      setLoading(false);
      console.log('Fetched and Combined Data:', combinedData);
    }

    fetchAccountsPayable();
  }, []);  // Empty dependency array so it runs only once on mount

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Accounts Payable</h2>
      <p className="mb-6">View your pending purchase orders and unreleased payroll data.</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <div className="space-y-2">
            <h3>Accounts Payable Data:</h3>
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Type</th>
                  <th className="border border-gray-300 px-4 py-2">Invoice ID</th>
                  <th className="border border-gray-300 px-4 py-2">Supplier/Employee Name</th>
                  <th className="border border-gray-300 px-4 py-2">PO Number/Salary</th>
                  <th className="border border-gray-300 px-4 py-2">Amount/Status</th>
                </tr>
              </thead>
              <tbody>
                {payableData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-4 py-2 text-center">
                      No pending accounts payable data.
                    </td>
                  </tr>
                )}
                {payableData.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.type}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.invoice_id}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.supplier_name || item.employee_name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.po_number || item.total_salary}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{item.amount || item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsPayable;
