import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ERPLayout } from '@/components/erp/ERPLayout';

import GeneralLedger from '@/components/financecomponents/GeneralLedger';
import AccountsPayable from '@/components/financecomponents/AccountsPayable';
import AccountsReceivable from '@/components/financecomponents/AccountsReceivable';
import FinancialReports from '@/components/financecomponents/FinancialReports';

export default function FinanceManagementPage() {
  return (
    <ERPLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Finance Management</h1>
          <p className="text-muted-foreground">Manage invoices, expenses, budgeting, and more</p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="general-ledger" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general-ledger">General Ledger</TabsTrigger>
            <TabsTrigger value="accounts-payable">Accounts Payable</TabsTrigger>
            <TabsTrigger value="accounts-receivable">Accounts Receivable</TabsTrigger>
            <TabsTrigger value="financialreports">Financial Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="general-ledger">
            <GeneralLedger />
          </TabsContent>

          <TabsContent value="accounts-payable"> {/* Fixed typo here */}
            <AccountsPayable />
          </TabsContent>

          <TabsContent value="accounts-receivable">
            <AccountsReceivable />
          </TabsContent>

          <TabsContent value="financialreports">
            <FinancialReports />
          </TabsContent>
        </Tabs>
      </div>
    </ERPLayout>
  );
}
