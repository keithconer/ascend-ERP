import React from 'react';
import { Card } from '@/components/ui/card';
import OrderSynchronization from './components/OrderSynchronization';
import { ERPLayout } from '@/components/erp/ERPLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Overview } from './components/Overview';
import SyncSettings from './components/SyncSettings';

const EcommerceManagement: React.FC = () => {
  return (
    <ERPLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">E-commerce Integration</h1>
            <p className="text-muted-foreground mt-2">
              Manage your e-commerce orders and synchronization
            </p>
          </div>
        </div>

        <Tabs defaultValue="sync" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sync">Real-Time Sync</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sync" className="space-y-4">
            <Card className="p-6">
              <OrderSynchronization />
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Overview />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="p-6">
              <SyncSettings />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ERPLayout>
  );
};

export default EcommerceManagement;
