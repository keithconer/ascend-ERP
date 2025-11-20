import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, CreditCard, Receipt, Store } from "lucide-react";
import { Shop } from "@/components/ecommerce/Shop";
import { Cart } from "@/components/ecommerce/Cart";
import { Payment } from "@/components/ecommerce/Payment";
import { Receipts } from "@/components/ecommerce/Receipts";
import { Badge } from "@/components/ui/badge";

const EcommercePage = () => {
  const [activeTab, setActiveTab] = useState("shop");
  const [cartItems, setCartItems] = useState<any[]>([]);

  const handleAddToCart = (product: any) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        );
      }
      
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const handleProceedToPayment = () => {
    setActiveTab("payment");
  };

  const handleCancelPayment = () => {
    setActiveTab("cart");
  };

  const handleOrderSuccess = () => {
    setCartItems([]);
    setActiveTab("receipts");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Store className="w-10 h-10 text-primary" />
            E-Commerce
          </h1>
          <p className="text-muted-foreground">Browse products, manage your cart, and complete orders</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="shop" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Shop
            </TabsTrigger>
            <TabsTrigger value="cart" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Cart
              {cartItems.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {cartItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2" disabled={cartItems.length === 0}>
              <CreditCard className="w-4 h-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Receipts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop" className="mt-0">
            <Shop onAddToCart={handleAddToCart} />
          </TabsContent>

          <TabsContent value="cart" className="mt-0">
            <Cart
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onProceedToPayment={handleProceedToPayment}
            />
          </TabsContent>

          <TabsContent value="payment" className="mt-0">
            <Payment
              cartItems={cartItems}
              onCancel={handleCancelPayment}
              onSuccess={handleOrderSuccess}
            />
          </TabsContent>

          <TabsContent value="receipts" className="mt-0">
            <Receipts />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EcommercePage;