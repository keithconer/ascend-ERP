import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ERPLayout } from '@/components/erp/ERPLayout';

import Shop from '@/components/Ecommerce/Shop';
import Cart from '@/components/Ecommerce/Cart';
import Payment from '@/components/Ecommerce/Payment';


export default function EcommercePage() {
  return (
    <ERPLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ecommerce Page</h1>
          <p className="text-muted-foreground">Go to shop, cart, payment, and more</p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="general-ledger" className="space-y-4">
          <TabsList>
            <TabsTrigger value="shop">Shop</TabsTrigger>
            <TabsTrigger value="cart">Cart</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="Shop">
            <Shop />
          </TabsContent>

          <TabsContent value="accounts-payable"> {/* Fixed typo here */}
            <Cart />
          </TabsContent>

          <TabsContent value="accounts-receivable">
            <Payment />
          </TabsContent>

        </Tabs>
      </div>
    </ERPLayout>
  );
}
