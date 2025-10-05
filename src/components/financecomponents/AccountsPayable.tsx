import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';  // Adjust path as necessary

const AccountsPayable = () => {
  const [payableData, setPayableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchAndInsertAccountsPayable() {
      setLoading(true);
      console.log('Fetching and inserting accounts payable data...');

      // Fetch pending Purchase Orders (POs) from 'purchase_orders' table along with PO items
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          supplier_id,
          status,
          suppliers(name),
          order_date,
          purchase_order_items(quantity, price, item_id)  // Get item quantity and price
        `)
        .eq('status', 'pending');  // Correct 'pending' status (lowercase)

      if (poError) {
        console.error('Error fetching Pending Purchase Orders:', poError.message);
      } else {
        console.log('Fetched Pending POs:', poData);
      }

      // Fetch pending payrolls from 'payroll' table
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select(`
          id,
          employee_id,
          status,
          salary,
          employees(first_name, last_name)  // Joining to get employee names
        `)
        .eq('status', 'Pending');  // Correct 'Pending' status (capitalized)

      if (payrollError) {
        console.error('Error fetching Pending Payrolls:', payrollError.message);
      } else {
        console.log('Fetched Pending Payrolls:', payrollData);
      }

      // Prepare data for insertion into accounts_payable table
      const dataToInsert = [];

      // Insert POs into the data array
      poData?.forEach(po => {
        const invoiceId = `PO-${po.id}`;  // Use PO ID for invoice ID to avoid random duplication

        // Calculate total amount for the PO based on item quantities and prices
        const totalAmount = po.purchase_order_items.reduce((acc: number, item: any) => {
          return acc + (item.quantity * item.price);  // Price * Quantity
        }, 0);

        // Check if the PO already exists in accounts_payable
        const existingPo = payableData.find(item => item.invoice_id === invoiceId);
        if (!existingPo) {
          dataToInsert.push({
            invoice_id: invoiceId,
            supplier_name: po.suppliers?.name ?? 'Unknown Supplier',
            po_number: po.po_number,
            amount: totalAmount,
            status: po.status,
            employee_name: null,  // No employee name for POs
          });
        }
      });

      // Insert Payroll data into the data array
      payrollData?.forEach(payroll => {
        const invoiceId = `PR-${payroll.id}`;  // Use payroll ID for invoice ID to avoid random duplication
        const employeeName = `${payroll.employees?.first_name} ${payroll.employees?.last_name}`;

        // Check if the Payroll already exists in accounts_payable
        const existingPayroll = payableData.find(item => item.invoice_id === invoiceId);
        if (!existingPayroll) {
          dataToInsert.push({
            invoice_id: invoiceId,
            supplier_name: null,  // No supplier name for Payrolls
            po_number: null,      // No PO number for Payrolls
            amount: payroll.salary,
            status: payroll.status,
            employee_name: employeeName,
          });
        }
      });

      // Insert the combined data into the 'accounts_payable' table
      if (dataToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('accounts_payable')
          .insert(dataToInsert);  // Using insert instead of upsert

        if (insertError) {
          console.error('Error inserting data into accounts_payable:', insertError.message);
        } else {
          console.log('Successfully inserted accounts payable data');
        }
      }

      // Fetch the inserted data and update the state
      const { data: newPayableData, error: fetchError } = await supabase
        .from('accounts_payable')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching data from accounts_payable:', fetchError.message);
      } else {
        setPayableData(newPayableData);
      }

      setLoading(false);
    }

    fetchAndInsertAccountsPayable();
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
            <h3 className="font-bold mb-2">Accounts Payable Data:</h3>
            <table className="min-w-full table-auto border-collapse border border-gray-300 mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2">Invoice ID</th>
                  <th className="border border-gray-300 px-4 py-2">Supplier/Employee Name</th>
                  <th className="border border-gray-300 px-4 py-2">PO Number</th>
                  <th className="border border-gray-300 px-4 py-2">Amount</th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
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
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.invoice_id}</td>
                    <td className="border border-gray-300 px-4 py-2">{item.supplier_name || item.employee_name}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.po_number || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">₱{item.amount?.toFixed(2) || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{item.status}</td>
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
