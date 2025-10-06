import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatPeso = (value: number) =>
  `₱${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;

const FinancialReports = () => {
  const [report, setReport] = useState<{
    overallReceipt: number;
    totalAssets: number;
    totalLiabilities: number;
    totalExpenses: number;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    console.log("fetchReport: starting");

    try {
      // STOCK‑IN
      const { data: stockIns, error: stockInsError } = await supabase
        .from('stock_transactions')
        .select('quantity, unit_cost')
        .eq('transaction_type', 'stock-in');
      if (stockInsError) {
        console.error('stockInsError:', stockInsError);
        throw stockInsError;
      }
      console.log("stockIns:", stockIns);
      const totalStockInValue =
        stockIns?.reduce((acc, r) => acc + r.quantity * r.unit_cost, 0) || 0;

      // APPROVED PURCHASE ORDERS
      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('status', 'approved');
      if (poError) {
        console.error('poError:', poError);
        throw poError;
      }
      console.log("poData:", poData);

      const totalPoApprovedSum = (
        await Promise.all(
          poData?.map(async (po) => {
            const { data: poItems, error: poItemsError } = await supabase
              .from('purchase_order_items')
              .select('quantity, price, item_id(unit_price)')
              .eq('purchase_order_id', po.id);
            if (poItemsError) {
              console.error('poItemsError:', poItemsError);
              return 0;
            }
            console.log("poItems for PO", po.id, poItems);
            return (
              poItems?.reduce((acc, item) => {
                const unitPrice =
                  item.price !== 0
                    ? item.price
                    : item.item_id.unit_price ?? 0;
                return acc + unitPrice * item.quantity;
              }, 0) || 0
            );
          }) || []
        )
      ).reduce((acc, v) => acc + v, 0);

      // PAYROLL (using `deduction`, not `deductions`)
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select('salary, deduction');
      if (payrollError) {
        console.error('payrollError:', payrollError);
        throw payrollError;
      }
      console.log("payrollData:", payrollData);
      const totalPayroll =
        payrollData?.reduce(
          (acc, row) => acc + (row.salary - (row.deduction ?? 0)),
          0
        ) || 0;

      // INVENTORY value
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('available_quantity, item_id');
      if (inventoryError) {
        console.error('inventoryError:', inventoryError);
        throw inventoryError;
      }
      console.log("inventoryData:", inventoryData);
      const itemIds = inventoryData?.map((inv) => inv.item_id) || [];

      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('id, unit_price')
        .in('id', itemIds);
      if (itemsError) {
        console.error('itemsError:', itemsError);
        throw itemsError;
      }
      console.log("itemsData:", itemsData);
      const itemPriceMap = new Map(itemsData?.map((i) => [i.id, i.unit_price]) || []);
      const totalInventoryValue =
        inventoryData?.reduce((acc, inv) => {
          const price = itemPriceMap.get(inv.item_id) ?? 0;
          return acc + price * inv.available_quantity;
        }, 0) || 0;

      // Sum for assets
      const totalAssets =
        totalStockInValue + totalPoApprovedSum + totalPayroll + totalInventoryValue;

      // LIABILITIES from accounts_payable
      const { data: accountsPayableData, error: apError } = await supabase
        .from('accounts_payable')
        .select('amount, status');
      if (apError) {
        console.error('apError:', apError);
        throw apError;
      }
      console.log("accountsPayableData:", accountsPayableData);
      const totalLiabilities =
        accountsPayableData
          ?.filter((ap) =>
            ['unpaid', 'pending', 'due'].includes((ap.status ?? '').toLowerCase())
          )
          .reduce((acc, ap) => acc + ap.amount, 0) || 0;

      // EXPENSES = stock-out + payroll
      const { data: stockOutsData, error: stockOutsError } = await supabase
        .from('stock_transactions')
        .select('quantity, unit_cost')
        .eq('transaction_type', 'stock-out');
      if (stockOutsError) {
        console.error('stockOutsError:', stockOutsError);
        throw stockOutsError;
      }
      console.log("stockOutsData:", stockOutsData);
      const totalStockOutValue =
        stockOutsData?.reduce((acc, r) => acc + r.quantity * r.unit_cost, 0) || 0;

      const totalExpenses = totalStockOutValue + totalPayroll;

      const newReport = {
        overallReceipt: totalStockInValue + totalPoApprovedSum,
        totalAssets,
        totalLiabilities,
        totalExpenses,
      };

      console.log("newReport:", newReport);
      setReport(newReport);
    } catch (err) {
      console.error('Error inside fetchReport:', err);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();

    const channel = supabase.channel('financial-reports-realtime');
    const tables = [
      'stock_transactions',
      'purchase_orders',
      'purchase_order_items',
      'payroll',
      'accounts_payable',
      'inventory',
      'items',
    ];

    for (const table of tables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          fetchReport();
        }
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReport]);

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

  const downloadPDF = () => {
    if (!report) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Financial Report', 14, 22);

    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 32);

    const tableColumn = ['Financial Metric', 'Amount (₱)'];
    const tableRows = [
      ['Overall Receipt', formatPeso(report.overallReceipt)],
      ['Total Assets', formatPeso(report.totalAssets)],
      ['Total Liabilities', formatPeso(report.totalLiabilities)],
      ['Total Expenses', formatPeso(report.totalExpenses)],
    ];

    // Use autoTable with doc
    autoTable(doc, {
      startY: 40,
      head: [tableColumn],
      body: tableRows,
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
            <table className="w-full text-left table-auto border-collapse border border-gray-300">
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
            >
              Download Excel
            </button>
            <button
              onClick={downloadPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
