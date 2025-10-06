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

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading...</p>
      </div>
    );
  }

  if (receivableData.length === 0) {
    return (
      <div className="p-4">
        <p className="text-center font-semibold text-gray-700">No data found.</p>
      </div>
    );
  }

  // If you want to render nothing when there is data, return null here.
  // Or render something else if needed.
  return null;
};

export default AccountsReceivable;
