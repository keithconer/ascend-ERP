import React, { useState } from 'react';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TicketManagementPage from './ticketManagement';
import KnowledgeBase from './components/KnowledgeBase';
import SLADashboard from './components/SLADashboard';
import CommunicationHistory from './components/CommunicationHistory';

const CustomerService = () => {
  return (
    <ERPLayout>
      <div className="p-6">
        <Tabs defaultValue="tickets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="sla">SLA Dashboard</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tickets">
            <TicketManagementPage />
          </TabsContent>
          
          <TabsContent value="knowledge">
            <KnowledgeBase />
          </TabsContent>
          
          <TabsContent value="sla">
            <SLADashboard />
          </TabsContent>
          
          <TabsContent value="communications">
            <CommunicationHistory />
          </TabsContent>
        </Tabs>
      </div>
    </ERPLayout>
  );
};

export default CustomerService;