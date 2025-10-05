import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust import path if needed

const formatPeso = (value: number) => `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;

const GeneralLedgerExport = () => {
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchGeneralLedger() {
      setLoading(true);

      // **Fetch Stock Ins (Debit)** - Transaction Type: 'stock-in'
      const { data: stockInsData, error: stockInsError } = await supabase
        .from('stock_transactions')
        .select('quantity, unit_cost')
        .eq('transaction_type', 'stock-in');

      if (stockInsError) {
        console.error('Error fetching stock-in data:', stockInsError.message);
      }

      const totalStockInValue = stockInsData?.reduce((acc, row) => {
        return acc + (row.quantity * row.unit_cost);
      }, 0) || 0;

      // **Fetch Stock Outs (Credit)** - Transaction Type: 'stock-out'
      const { data: stockOutsData, error: stockOutsError } = await supabase
        .from('stock_transactions')
        .select('quantity, unit_cost')
        .eq('transaction_type', 'stock-out');

      if (stockOutsError) {
        console.error('Error fetching stock-out data:', stockOutsError.message);
      }

      const totalStockOutValue = stockOutsData?.reduce((acc, row) => {
        return acc + (row.quantity * row.unit_cost);
      }, 0) || 0;

      // **Fetch PO Approved Data (Procurement)**
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('status', 'approved');

      if (poError) {
        console.error('Error fetching PO data:', poError.message);
      }

      // **Fetch Purchase Order Items for Approved Purchase Orders**
      const totalPoValue = await Promise.all(poData?.map(async (po) => {
        const { data: poItems, error: poItemsError } = await supabase
          .from('purchase_order_items')
          .select('price, quantity')
          .eq('purchase_order_id', po.id);

        if (poItemsError) {
          console.error('Error fetching PO items data:', poItemsError.message);
        }

        return poItems?.reduce((acc, item) => {
          return acc + (item.price * item.quantity);
        }, 0) || 0;
      }));

      const totalPoApproved = totalPoValue.reduce((acc, val) => acc + val, 0);

      // **Fetch Payroll Data (HR Module)**
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select('salary, deduction');

      if (payrollError) {
        console.error('Error fetching payroll data:', payrollError.message);
      }

      const totalPayroll = payrollData?.reduce((acc, row) => {
        const netSalary = row.salary - row.deduction;
        return acc + netSalary;
      }, 0) || 0;

      // **Structure the final ledger data**
      const ledger = [
        {
          description: 'Stock Ins',
          debit: totalStockInValue,
          credit: 0,
        },
        {
          description: 'Stock Outs',
          debit: 0,
          credit: totalStockOutValue,
        },
        {
          description: 'PO Approved',
          debit: 0,
          credit: totalPoApproved,
        },
        {
          description: 'Total Payroll',
          debit: totalPayroll,  // Total Payroll is now Debit
          credit: 0,
        },
      ];

      setLedgerData(ledger);
      setLoading(false);
    }

    fetchGeneralLedger();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">General Ledger</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Debit</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData.map((entry, index) => (
              <tr key={index}>
                <td className="border border-gray-300 px-4 py-2">{entry.description}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatPeso(entry.debit)}</td>
                <td className="border border-gray-300 px-4 py-2 text-right">{formatPeso(entry.credit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GeneralLedgerExport;
