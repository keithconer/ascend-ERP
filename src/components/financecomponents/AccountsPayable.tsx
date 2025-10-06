'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust path as necessary

interface PayableSummary {
  id: number;
  invoice_id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
}

const generateInvoiceId = (): string => {
  const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `AP-${randomStr}`;
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AccountsPayable: React.FC = () => {
  const [payableSummary, setPayableSummary] = useState<PayableSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const monthStart = new Date(year, month, 1).toISOString();
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

        // Fetch payrolls with status 'Pending' within current month
        const { data: payrolls, error: payrollError } = await supabase
          .from('payroll')
          .select('salary')
          .gte('payroll_period_start', monthStart)
          .lte('payroll_period_end', monthEnd)
          .eq('status', 'Pending');

        if (payrollError) {
          console.error('Error fetching payroll total:', payrollError.message);
        }

        const totalPayrollAmount = payrolls?.reduce((acc, p) => acc + (p.salary ?? 0), 0) || 0;

        // Fetch approved purchase orders totals
        const { data: approvedPOs, error: poError } = await supabase
          .from('purchase_orders')
          .select('total')
          .eq('status', 'approved');

        if (poError) {
          console.error('Error fetching approved POs total:', poError.message);
        }

        const totalApprovedPOAmount = approvedPOs?.reduce((acc, po) => acc + (po.total ?? 0), 0) || 0;

        const todayStr = formatDate(now);

        const summaryData: PayableSummary[] = [
          {
            id: 1,
            invoice_id: generateInvoiceId(),
            date: todayStr,
            description: 'Total Payroll (Month)',
            amount: totalPayrollAmount,
            status: 'Pending',
          },
          {
            id: 2,
            invoice_id: generateInvoiceId(),
            date: todayStr,
            description: 'Total Approved POs',
            amount: totalApprovedPOAmount,
            status: 'Pending',
          },
        ];

        setPayableSummary(summaryData);
      } catch (error) {
        console.error('Error fetching accounts payable summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Accounts Payable Summary</h2>
      <p className="mb-6">Summary of total payroll and approved purchase orders for the current month.</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="min-w-full table-auto border-collapse border border-gray-300 mb-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-center">Date</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Invoice ID</th>
              <th className="border border-gray-300 px-4 py-2">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Amount</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {payableSummary.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-4 py-2 text-center">
                  No accounts payable summary data available.
                </td>
              </tr>
            ) : (
              payableSummary.map(({ id, invoice_id, date, description, amount, status }) => (
                <tr key={id}>
                  <td className="border border-gray-300 px-4 py-2 text-center">{date}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{invoice_id}</td>
                  <td className="border border-gray-300 px-4 py-2">{description}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₱{amount.toFixed(2)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AccountsPayable;
