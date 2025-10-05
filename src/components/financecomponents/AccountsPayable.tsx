'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust path as necessary

const AccountsPayable = () => {
  const [payableData, setPayableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchAccountsPayableData() {
      setLoading(true);
      console.log('Fetching accounts payable data...');

      // Fetch initial pending Purchase Orders (POs)
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select(`
          id,
          po_number,
          supplier_id,
          status,
          suppliers(name),
          order_date,
          purchase_order_items(quantity, price, item_id)
        `)
        .eq('status', 'pending');  // Only pending POs

      if (poError) {
        console.error('Error fetching Pending Purchase Orders:', poError.message);
      } else {
        console.log('Fetched Pending POs:', poData);
      }

      // Fetch initial pending payrolls
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select(`
          id,
          employee_id,
          status,
          salary,
          employees(first_name, last_name)
        `)
        .eq('status', 'Pending');  // Only pending payrolls

      if (payrollError) {
        console.error('Error fetching Pending Payrolls:', payrollError.message);
      } else {
        console.log('Fetched Pending Payrolls:', payrollData);
      }

      // Combine the fetched data and store it
      const initialData = [];

      // Insert POs into the data array
      poData?.forEach(po => {
        const invoiceId = `PO-${po.id}`;

        const totalAmount = po.purchase_order_items.reduce((acc: number, item: any) => {
          return acc + (item.quantity * item.price);  // Calculate total price for PO
        }, 0);

        initialData.push({
          invoice_id: invoiceId,
          supplier_name: po.suppliers?.name ?? 'Unknown Supplier',
          po_number: po.po_number,
          amount: totalAmount,
          status: po.status,
          employee_name: null,
        });
      });

      // Insert Payroll data into the data array
      payrollData?.forEach(payroll => {
        const invoiceId = `PR-${payroll.id}`;
        const employeeName = `${payroll.employees?.first_name} ${payroll.employees?.last_name}`;

        initialData.push({
          invoice_id: invoiceId,
          supplier_name: null,
          po_number: null,
          amount: payroll.salary,
          status: payroll.status,
          employee_name: employeeName,
        });
      });

      // Set initial data
      setPayableData(initialData);
      setLoading(false);

      // Listen for changes in the purchase_orders table (new pending POs)
      const purchaseOrdersSubscription = supabase
        .from('purchase_orders')
        .on('INSERT', payload => {
          if (payload.new.status === 'pending') {
            const po = payload.new;

            // Calculate total for new PO
            const totalAmount = po.purchase_order_items.reduce((acc: number, item: any) => {
              return acc + (item.quantity * item.price);
            }, 0);

            setPayableData(prevData => [
              ...prevData,
              {
                invoice_id: `PO-${po.id}`,
                supplier_name: po.suppliers?.name ?? 'Unknown Supplier',
                po_number: po.po_number,
                amount: totalAmount,
                status: po.status,
                employee_name: null,
              }
            ]);
          }
        })
        .subscribe();

      // Listen for changes in the payroll table (new pending payrolls)
      const payrollsSubscription = supabase
        .from('payroll')
        .on('INSERT', payload => {
          if (payload.new.status === 'Pending') {
            const payroll = payload.new;

            setPayableData(prevData => [
              ...prevData,
              {
                invoice_id: `PR-${payroll.id}`,
                supplier_name: null,
                po_number: null,
                amount: payroll.salary,
                status: payroll.status,
                employee_name: `${payroll.employees?.first_name} ${payroll.employees?.last_name}`,
              }
            ]);
          }
        })
        .subscribe();

      // Clean up the subscription when the component is unmounted
      return () => {
        purchaseOrdersSubscription.unsubscribe();
        payrollsSubscription.unsubscribe();
      };
    }

    fetchAccountsPayableData();
  }, []);

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
