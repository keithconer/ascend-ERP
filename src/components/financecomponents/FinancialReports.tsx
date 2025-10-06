'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Format number as Philippine Peso string with commas and 2 decimals
const formatPeso = (value: number): string =>
  `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;

interface FinancialReport {
  overallReceipt: number;
  totalAssets: number;
  totalLiabilities: number;
  totalExpenses: number;
}

const FinancialReports: React.FC = () => {
  const [report, setReport] = useState<FinancialReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      // --- Stock-in transactions (Assets) ---
      const { data: stockIns, error: stockInsError } = await supabase
        .from('stock_transactions')
        .select('quantity, unit_cost')
        .eq('transaction_type', 'stock-in');
      if (stockInsError) throw stockInsError;

      const totalStockInValue =
        stockIns?.reduce((sum, r) => sum + r.quantity * r.unit_cost, 0) || 0;

      // --- Approved purchase orders (Assets part) ---
      const { data: approvedPOs, error: approvedPOsError } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('status', 'approved');
      if (approvedPOsError) throw approvedPOsError;

      // Sum each approved PO's items (quantity * price or fallback item.unit_price)
      const totalApprovedPoSum = (
        await Promise.all(
          approvedPOs?.map(async (po) => {
            const { data: poItems, error: poItemsError } = await supabase
              .from('purchase_order_items')
              .select('quantity, price, item_id(unit_price)')
              .eq('purchase_order_id', po.id);
            if (poItemsError) return 0;

            return (
              poItems?.reduce((sum, item) => {
                const unitPrice =
                  item.price !== 0 ? item.price : item.item_id?.unit_price ?? 0;
                return sum + item.quantity * unitPrice;
              }, 0) || 0
            );
          }) || []
        )
      ).reduce((sum, val) => sum + val, 0);

      // --- Payroll (used in assets and expenses, total for liabilities too) ---
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select('salary, deduction');
      if (payrollError) throw payrollError;

      const totalPayroll =
        payrollData?.reduce((sum, p) => sum + (p.salary - (p.deduction ?? 0)), 0) || 0;

      // --- Inventory (Assets) ---
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('available_quantity, item_id');
      if (inventoryError) throw inventoryError;

      const itemIds = inventoryData?.map((i) => i.item_id) || [];

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, unit_price')
        .in('id', itemIds);
      if (itemsError) throw itemsError;

      const priceMap = new Map(itemsData?.map((i) => [i.id, i.unit_price]) || []);
      const totalInventoryValue =
        inventoryData?.reduce((sum, inv) => {
          const price = priceMap.get(inv.item_id) ?? 0;
          return sum + price * inv.available_quantity;
        }, 0) || 0;

      // --- Total Assets ---
      // Keep assets as before, including stock-in, approved PO sum, payroll, inventory
      const totalAssets =
        totalStockInValue + totalApprovedPoSum + totalPayroll + totalInventoryValue;

      // --- Liabilities ---
      // Now: total liabilities = total purchase orders with status 'approved' or 'pending' + total payroll
      // Fetch purchase orders with status approved or pending (pending means liabilities too)
      const { data: poLiabilities, error: poLiabilitiesError } = await supabase
        .from('purchase_orders')
        .select('id, status')
        .in('status', ['approved', 'pending']);
      if (poLiabilitiesError) throw poLiabilitiesError;

      // Sum PO items for liabilities (approved + pending)
      const totalPOLiabilitiesSum = (
        await Promise.all(
          poLiabilities?.map(async (po) => {
            const { data: poItems, error: poItemsError } = await supabase
              .from('purchase_order_items')
              .select('quantity, price, item_id(unit_price)')
              .eq('purchase_order_id', po.id);
            if (poItemsError) return 0;

            return (
              poItems?.reduce((sum, item) => {
                const unitPrice =
                  item.price !== 0 ? item.price : item.item_id?.unit_price ?? 0;
                return sum + item.quantity * unitPrice;
              }, 0) || 0
            );
          }) || []
        )
      ).reduce((sum, val) => sum + val, 0);

      // Payroll is also counted fully for liabilities
      const totalLiabilities = totalPOLiabilitiesSum + totalPayroll;

      // --- Stock-out transactions (Expenses) ---
      const { data: stockOuts, error: stockOutsError } = await supabase
        .from('stock_transactions')
        .select('quantity, unit_cost')
        .eq('transaction_type', 'stock-out');
      if (stockOutsError) throw stockOutsError;

      const totalStockOutValue =
        stockOuts?.reduce((sum, r) => sum + r.quantity * r.unit_cost, 0) || 0;

      // --- Total Expenses ---
      const totalExpenses = totalStockOutValue + totalPayroll;

      // --- Overall Receipt ---
      const overallReceipt = totalStockInValue + totalApprovedPoSum;

      setReport({
        overallReceipt,
        totalAssets,
        totalLiabilities,
        totalExpenses,
      });
    } catch (err) {
      console.error('Error fetching financial report:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscriptions for live updates
  useEffect(() => {
    fetchReport();

    const tables = [
      'stock_transactions',
      'purchase_orders',
      'purchase_order_items',
      'payroll',
      'inventory',
      'items',
    ];

    const channel = supabase.channel('financial-reports-live');

    tables.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          fetchReport();
        }
      );
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReport]);

  // Download Excel version of report
  const downloadExcel = () => {
    if (!report) return;

    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Financial Metric', 'Amount (₱)'],
      ['Overall Receipt', report.overallReceipt],
      ['Total Assets', report.totalAssets],
      ['Total Liabilities', report.totalLiabilities],
      ['Total Expenses', report.totalExpenses],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    saveAs(blob, 'Financial_Report.xlsx');
  };

  // Download PDF version of report
  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Financial Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 32);

    const head = ['Financial Metric', 'Amount (₱)'];
    const body = [
      ['Overall Receipt', formatPeso(report.overallReceipt)],
      ['Total Assets', formatPeso(report.totalAssets)],
      ['Total Liabilities', formatPeso(report.totalLiabilities)],
      ['Total Expenses', formatPeso(report.totalExpenses)],
    ];

    autoTable(doc, {
      startY: 40,
      head: [head],
      body,
      theme: 'striped',
      styles: { halign: 'right' },
      headStyles: { halign: 'center' },
    });

    doc.save('Financial_Report.pdf');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white shadow rounded">
      <h1 className="text-3xl font-bold mb-6 text-center">Financial Report</h1>
      {loading ? (
        <p className="text-center">Loading...</p>
      ) : report ? (
        <>
          <div className="border p-4 rounded shadow-sm bg-gray-50 mb-6">
            <h2 className="text-xl font-semibold mb-3">Summary</h2>
            <table className="w-full table-auto border-collapse border border-gray-300">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-medium">Overall Receipt</td>
                  <td className="py-2 px-4 text-right">
                    {formatPeso(report.overallReceipt)}
                  </td>
                </tr>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <td className="py-2 px-4 font-medium">Total Assets</td>
                  <td className="py-2 px-4 text-right">
                    {formatPeso(report.totalAssets)}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 font-medium">Total Liabilities</td>
                  <td className="py-2 px-4 text-right">
                    {formatPeso(report.totalLiabilities)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 font-medium">Total Expenses</td>
                  <td className="py-2 px-4 text-right">
                    {formatPeso(report.totalExpenses)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={downloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              type="button"
            >
              Download Excel
            </button>
            <button
              onClick={downloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              type="button"
            >
              Download PDF
            </button>
          </div>
        </>
      ) : (
        <p className="text-center">No financial data available.</p>
      )}
    </div>
  );
};

export default FinancialReports;
