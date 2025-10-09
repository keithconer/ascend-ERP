// src/components/QuotationManagement.tsx
import React, { useState, useEffect } from 'react';

// Define types for Quotation
type Quotation = {
  id: number;
  customerName: string;
  totalAmount: number;
  status: string;
};

const QuotationManagement: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  useEffect(() => {
    // Example fetching from Supabase (replace with your actual query)
    const fetchQuotations = async () => {
      // const { data, error } = await supabase.from('quotations').select('*');
      // if (error) console.log('Error fetching quotations:', error);
      // else setQuotations(data);

      // For now, mock data:
      setQuotations([
        { id: 1, customerName: 'Customer A', totalAmount: 1000, status: 'Pending' },
        { id: 2, customerName: 'Customer B', totalAmount: 1500, status: 'Accepted' },
      ]);
    };

    fetchQuotations();
  }, []);

  return (
    <div>
      <h1>Quotation Management</h1>
      <ul>
        {quotations.map((quotation) => (
          <li key={quotation.id}>
            {quotation.customerName} - ${quotation.totalAmount} - {quotation.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuotationManagement;
