-- Create enum types
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE sync_status AS ENUM ('synced', 'pending', 'failed');
CREATE TYPE ecommerce_platform AS ENUM ('shopify', 'woocommerce', 'magento', 'custom');

-- Create the ecommerce_orders table
CREATE TABLE ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_order_id TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    order_status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    items JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    platform ecommerce_platform NOT NULL,
    sync_status sync_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_external_order_id UNIQUE (external_order_id, platform)
);

-- Create indexes
CREATE INDEX idx_ecommerce_orders_customer_id ON ecommerce_orders(customer_id);
CREATE INDEX idx_ecommerce_orders_order_status ON ecommerce_orders(order_status);
CREATE INDEX idx_ecommerce_orders_sync_status ON ecommerce_orders(sync_status);
CREATE INDEX idx_ecommerce_orders_created_at ON ecommerce_orders(created_at DESC);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_ecommerce_orders_updated_at
    BEFORE UPDATE ON ecommerce_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON ecommerce_orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
