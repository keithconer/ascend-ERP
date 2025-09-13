import { supabase } from '@/integrations/supabase/client';

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('ecommerce_orders')
      .select('count(*)');

    console.log('Connection test result:', { data: testData, error: testError });

    // Try to get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('ecommerce_orders')
      .select('*');

    console.log('Orders query result:', {
      success: !ordersError,
      orderCount: orders?.length,
      orders,
      error: ordersError
    });

    return {
      success: !ordersError,
      orders
    };
  } catch (err) {
    console.error('Test failed:', err);
    return {
      success: false,
      error: err
    };
  }
}

export { testDatabaseConnection };
