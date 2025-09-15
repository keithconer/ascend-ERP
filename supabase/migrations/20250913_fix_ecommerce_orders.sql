-- Drop the existing table if it exists
DROP TABLE IF EXISTS ecommerce_orders CASCADE;

-- Create enum types
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed');

-- Recreate the table with correct structure
CREATE TABLE ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_order_id TEXT,
    customer_name TEXT NOT NULL,
    order_status order_status DEFAULT 'pending',
    total_amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    items JSONB DEFAULT '[]'::jsonb,
    shipping_address JSONB,
    sync_status sync_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_ecommerce_orders_status ON ecommerce_orders(order_status);
CREATE INDEX idx_ecommerce_orders_sync_status ON ecommerce_orders(sync_status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ecommerce_orders_updated_at
    BEFORE UPDATE ON ecommerce_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add some test data
INSERT INTO ecommerce_orders (
    external_order_id,
    customer_name,
    order_status,
    total_amount,
    currency,
    items,
    shipping_address,
    sync_status
) VALUES (
    'ORD-TEST-001',
    'John Doe',
    'pending',
    99.99,
    'USD',
    '[{"id": "1", "name": "Test Product", "quantity": 1, "price": 99.99}]',
    '{"address": "123 Test St", "city": "Test City", "country": "US"}',
    'pending'
);
