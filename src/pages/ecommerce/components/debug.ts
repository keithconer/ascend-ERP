import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');

    // First check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Not authenticated');
    }

    // Test querying the orders table
    const { data: orders, error: ordersError } = await supabase
      .from('ecommerce_orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      console.error('Database query error:', ordersError);
      throw ordersError;
    }

    console.log('Connection test successful');
    return {
      success: true,
      orders,
      message: 'Successfully connected to database'
    };

  } catch (error) {
    console.error('Connection test failed:', error);
    toast({
      variant: "destructive",
      title: "Connection Test Failed",
      description: error.message || "Failed to connect to database"
    });
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to connect to database'
    };
  }
};

export const checkDatabaseTables = async () => {
  try {
    // Check if required tables exist
    const { data, error } = await supabase
      .from('ecommerce_orders')
      .select('count(*)');

    if (error) {
      if (error.code === '42P01') { // table does not exist
        return {
          success: false,
          error: 'Required tables are missing',
          details: error.message
        };
      }
      throw error;
    }

    return {
      success: true,
      message: 'All required tables exist'
    };
    
  } catch (error) {
    console.error('Table check failed:', error);
    return {
      success: false,
      error: error.message,
      details: 'Failed to verify database structure'
    };
  }
};
