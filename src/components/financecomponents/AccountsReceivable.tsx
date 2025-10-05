import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust import path if needed

const AccountsReceivable = () => {
  const [receivableData, setReceivableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function fetchAccountsReceivable() {
      setLoading(true);
      const { data, error } = await supabase.from('accounts_receivable').select('*');

      if (error) {
        console.error('Error fetching accounts receivable data:', error.message);
        setReceivableData([]);
      } else {
        setReceivableData(data || []);
      }
      setLoading(false);
    }

    fetchAccountsReceivable();
  }, []);

  const exportAccountsReceivableToCSV = () => {
    if (receivableData.length === 0) {
      alert('No data to export');
      return;
    }

    const csvRows: string[] = [];

    // Add header row (based on object keys)
    const headers = Object.keys(receivableData[0]).join(',');
    csvRows.push(headers);

    // Add data rows
    receivableData.forEach(row => {
      const values = Object.values(row).join(',');
      csvRows.push(values);
    });

    // Convert CSV data to a Blob and trigger download
    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    // Create a link to download the CSV file
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts_receivable_${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the Blob URL
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Accounts Receivable</h2>
      <p className="mb-6">View and export your accounts receivable data.</p>

      {loading ? <p>Loading...</p> : (
        <div>
          <button
            onClick={exportAccountsReceivableToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded mb-4"
          >
            Export Accounts Receivable to CSV
          </button>

          <div className="space-y-2">
            <h3>Accounts Receivable Data:</h3>
            <pre>{JSON.stringify(receivableData, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsReceivable;
