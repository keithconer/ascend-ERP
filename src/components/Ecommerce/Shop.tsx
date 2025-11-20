import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";

interface ShopProps {
  onAddToCart: (product: any) => void;
}

export const Shop = ({ onAddToCart }: ShopProps) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data: items, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .eq("is_active", true);
      
      if (itemsError) throw itemsError;

      // Get inventory for each item
      const itemsWithInventory = await Promise.all(
        items.map(async (item) => {
          const { data: inventory } = await supabase
            .from("inventory")
            .select("quantity, warehouse_id, warehouses(name)")
            .eq("item_id", item.id)
            .single();
          
          return {
            ...item,
            stock: inventory?.quantity || 0,
            warehouse: inventory?.warehouses?.name || "Unknown"
          };
        })
      );

      return itemsWithInventory;
    },
  });

  const handleAddToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.error("Out of stock", {
        description: "This product is currently unavailable."
      });
      return;
    }
    onAddToCart(product);
    toast.success("Added to cart", {
      description: `${product.name} has been added to your cart.`
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-4">
              <div className="h-6 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded" />
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-muted rounded w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">Our Products</h2>
        <p className="text-muted-foreground">Browse our inventory and add items to your cart</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map((product) => (
          <Card 
            key={product.id} 
            className="group hover:shadow-hover transition-all duration-300 border-2 hover:border-primary/50"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {product.name}
                </CardTitle>
                <Badge 
                  variant={product.stock > 10 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                  className="shrink-0"
                >
                  <Package className="w-3 h-3 mr-1" />
                  {product.stock}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description || "No description available"}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-primary">
                  ₱{product.unit_price.toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">
                  per {product.unit_of_measure || "unit"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                SKU: {product.sku}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleAddToCart(product)}
                disabled={product.stock <= 0}
                className="w-full group-hover:shadow-md transition-shadow"
                variant={product.stock > 0 ? "default" : "secondary"}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};