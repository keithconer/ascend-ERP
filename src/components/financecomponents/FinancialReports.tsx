import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust import path if needed

const FinancialReports = () => {
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchFinancialReports() {
      const { data, error } = await supabase.from('financial_reports').select('*');
      if (error) {
        console.error('Error fetching financial reports:', error.message);
        setReportData([]);
      } else {
        setReportData(data || []);
      }
    }

    fetchFinancialReports();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Financial Reports</h2>
      {reportData.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <pre>{JSON.stringify(reportData, null, 2)}</pre>
      )}
    </div>
  );
};

export default FinancialReports;
