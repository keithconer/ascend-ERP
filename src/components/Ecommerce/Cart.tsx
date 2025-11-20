import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CartItem {
  id: string;
  name: string;
  unit_price: number;
  quantity: number;
  stock: number;
  sku: string;
}

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToPayment: () => void;
}

export const Cart = ({ cartItems, onUpdateQuantity, onRemoveItem, onProceedToPayment }: CartProps) => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <ShoppingBag className="w-24 h-24 text-muted-foreground/50 mb-4" />
        <h3 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h3>
        <p className="text-muted-foreground">Add some products to get started!</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Shopping Cart</h2>
        <p className="text-muted-foreground">Review your items and proceed to checkout</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {item.stock} in stock
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium">Qty:</label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={item.stock}
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (value > 0 && value <= item.stock) {
                                onUpdateQuantity(item.id, value);
                              }
                            }}
                            className="w-20 text-center"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onUpdateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                            disabled={item.quantity >= item.stock}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-primary">
                          ₱{(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-medium">
                      ₱{(item.unit_price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              
              <div className="h-px bg-border" />
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">
                  ₱{subtotal.toLocaleString()}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={onProceedToPayment}
                className="w-full text-lg h-12"
                size="lg"
              >
                Proceed to Payment
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};