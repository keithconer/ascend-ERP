import React from 'react';
import { ERPLayout } from '@/components/erp/ERPLayout';
import TicketManagementPage from './ticketManagement';

const CustomerService = () => {
  return (
    <ERPLayout>
      <TicketManagementPage />
    </ERPLayout>
  );
};

export default CustomerService;