import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Adjust import path if needed

const GeneralLedgerExport = () => {
  const [ledgerData, setLedgerData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchGeneralLedger() {
      const { data, error } = await supabase.from('general_ledger').select('*');
      if (error) {
        console.error('Error fetching ledger data:', error.message);
        setLedgerData([]);
      } else {
        setLedgerData(data || []);
      }
    }

    fetchGeneralLedger();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">General Ledger</h2>
      {ledgerData.length === 0 ? (
        <p>No data available.</p>
      ) : (
        <pre>{JSON.stringify(ledgerData, null, 2)}</pre>
      )}
    </div>
  );
};

export default GeneralLedgerExport;
