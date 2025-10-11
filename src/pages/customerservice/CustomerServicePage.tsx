// src/pages/customerService/CustomerServicePage.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Ticket from '@/components/customerservice/Ticket';
import OrderHistory from '@/components/customerservice/OrderHistory';
import PaymentStatus from '@/components/customerservice/PaymentStatus';
import ProductStatus from '@/components/customerservice/ProductStatus';
import Issues from '@/components/customerservice/Issues';
import Solutions from '@/components/customerservice/Solutions';

export default function CustomerServicePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Customer Service</h1>
        <p className="text-muted-foreground">
          Manage customer inquiries, track tickets, and provide timely solutions
        </p>
      </div>

    
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>

        <TabsTrigger value="issues">Issues</TabsTrigger>
        <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="ticket-management">Ticket Management</TabsTrigger>
        </TabsList>

        {/* Ticket Management Sub-tabs */}
        <TabsContent value="ticket-management">
          <Tabs defaultValue="ticket" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ticket">Ticket</TabsTrigger>
              <TabsTrigger value="order-history">Order History</TabsTrigger>
              <TabsTrigger value="payment-status">Payment Status</TabsTrigger>
              <TabsTrigger value="product-status">Product Status</TabsTrigger>
            </TabsList>

            <TabsContent value="ticket">
              <Ticket />
            </TabsContent>
            <TabsContent value="order-history">
              <OrderHistory />
            </TabsContent>
            <TabsContent value="payment-status">
              <PaymentStatus />
            </TabsContent>
            <TabsContent value="product-status">
              <ProductStatus />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="issues">
          <Issues />
        </TabsContent>

        <TabsContent value="solutions">
          <Solutions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
