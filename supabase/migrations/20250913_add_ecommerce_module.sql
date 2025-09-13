-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing types if they exist
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        DROP TYPE order_status CASCADE;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_status') THEN
        DROP TYPE sync_status CASCADE;
    END IF;
END $$;

-- Create enum types for order status and sync status
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE sync_status AS ENUM ('pending', 'synced', 'failed');

-- Drop existing tables if they exist
DROP TABLE IF EXISTS ecommerce_sync_events CASCADE;
DROP TABLE IF EXISTS ecommerce_order_items CASCADE;
DROP TABLE IF EXISTS ecommerce_orders CASCADE;

-- Create the orders table
CREATE TABLE ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_order_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    order_status order_status DEFAULT 'pending',
    sync_status sync_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create the order items table
CREATE TABLE ecommerce_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_ecommerce_orders_external_id ON ecommerce_orders(external_order_id);
CREATE INDEX idx_ecommerce_orders_status ON ecommerce_orders(order_status);
CREATE INDEX idx_ecommerce_orders_sync_status ON ecommerce_orders(sync_status);
CREATE INDEX idx_ecommerce_order_items_order ON ecommerce_order_items(order_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updating the updated_at column
CREATE TRIGGER update_ecommerce_orders_updated_at
    BEFORE UPDATE ON ecommerce_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON ecommerce_orders
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON ecommerce_order_items
    FOR ALL USING (auth.role() = 'authenticated');

-- Create or replace the function to sync order with inventory
CREATE OR REPLACE FUNCTION sync_order_with_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Update inventory quantities
    UPDATE items i
    SET current_stock = i.current_stock - oi.quantity
    FROM ecommerce_order_items oi
    WHERE i.id = oi.item_id
    AND oi.order_id = NEW.id;

    -- Create stock transactions for each item
    INSERT INTO stock_transactions (
        item_id,
        warehouse_id,
        quantity,
        transaction_type,
        reference_id,
        notes
    )
    SELECT 
        oi.item_id,
        (SELECT id FROM warehouses LIMIT 1), -- Default warehouse, adjust as needed
        oi.quantity * -1, -- Negative for outgoing stock
        'sale',
        NEW.id,
        'E-commerce order: ' || NEW.external_order_id
    FROM ecommerce_order_items oi
    WHERE oi.order_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order sync
CREATE TRIGGER sync_ecommerce_order
    AFTER INSERT ON ecommerce_orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_order_with_inventory();

-- Create notifications table for sync events
CREATE TABLE ecommerce_sync_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES ecommerce_orders(id),
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for sync events
ALTER TABLE ecommerce_sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for authenticated users" ON ecommerce_sync_events
    FOR ALL USING (auth.role() = 'authenticated');
