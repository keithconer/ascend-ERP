import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ERPLayout } from '@/components/erp/ERPLayout';

// Import components for HR tabs
import LeadsManagement from '@/components/sales/LeadsManagement';
import QuotationManagement from '@/components/sales/QuotationManagement';
import SalesOrderManagement from '@/components/sales/SalesOrderManagement';

export default function SalesPage() {
  return (
    <ERPLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales & CRM</h1>
          <p className="text-muted-foreground">Manage customer leads, quotation, and sales order management.</p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="leads-management" className="space-y-4">
          <TabsList>
            <TabsTrigger value="leads-management">Leads Management</TabsTrigger>
            <TabsTrigger value="quotation-management">Quotation Management</TabsTrigger>
            <TabsTrigger value="sales-order-management">Sales Order Management</TabsTrigger>
        
          </TabsList>

          <TabsContent value="leads-management">
            <LeadsManagement />
          </TabsContent>

          <TabsContent value="quotation-management">
            <QuotationManagement />
          </TabsContent>


          <TabsContent value="sales-order-management">
            <SalesOrderManagement />
          </TabsContent>

    

    
        </Tabs>
      </div>
    </ERPLayout>
  );
}
