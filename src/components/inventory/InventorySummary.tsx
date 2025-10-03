import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const InventorySummary = () => {
  const { data: inventoryData, isLoading, error } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select(`
            id,
            quantity,
            reserved_quantity,
            available_quantity,
            items (
              name,
              sku,
              category_id,
              min_threshold,
              max_threshold,
              categories (
                name
              )
            )
          `)
          .limit(1000); // Adjust as needed

        if (error) {
          console.error('Supabase query error:', error);
          throw new Error('Failed to fetch inventory data');
        }

        return data || [];
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,  // Cache data for 5 minutes
    cacheTime: 10 * 60 * 1000, // Cache time of 10 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Error loading inventory data. Check the console for more details.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-300">Item</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-300">Category</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-300">Qty On Hand</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-300">Qty Needed</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600 border-b border-gray-300">Order Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {inventoryData?.map((item) => {
                const availableQty = item.available_quantity < 0 ? 0 : item.available_quantity;
                const minThreshold = item.items.min_threshold || 0;
                const qtyNeeded = minThreshold - availableQty;
                const orderAmount = qtyNeeded > 0 ? qtyNeeded : 0;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">{item.items.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">{item.items.categories.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">{availableQty}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">{minThreshold}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-200">{orderAmount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
