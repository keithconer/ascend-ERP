-- Insert some test orders
INSERT INTO ecommerce_orders (
    external_order_id,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    billing_address,
    order_status,
    sync_status,
    total_amount,
    currency,
    notes
) VALUES
(
    'ORD-001-2025',
    'John Smith',
    'john.smith@email.com',
    '+1-555-0123',
    '{"line1": "123 Main St", "city": "New York", "state": "NY", "postal_code": "10001", "country": "USA"}',
    '{"line1": "123 Main St", "city": "New York", "state": "NY", "postal_code": "10001", "country": "USA"}',
    'pending',
    'pending',
    299.99,
    'USD',
    'Priority shipping requested'
),
(
    'ORD-002-2025',
    'Sarah Johnson',
    'sarah.j@email.com',
    '+1-555-0124',
    '{"line1": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "postal_code": "90001", "country": "USA"}',
    '{"line1": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "postal_code": "90001", "country": "USA"}',
    'processing',
    'synced',
    149.99,
    'USD',
    'Gift wrapping included'
),
(
    'ORD-003-2025',
    'Michael Brown',
    'mike.b@email.com',
    '+1-555-0125',
    '{"line1": "789 Pine St", "city": "Chicago", "state": "IL", "postal_code": "60601", "country": "USA"}',
    '{"line1": "789 Pine St", "city": "Chicago", "state": "IL", "postal_code": "60601", "country": "USA"}',
    'delivered',
    'synced',
    499.99,
    'USD',
    'Express delivery completed'
),
(
    'ORD-004-2025',
    'Emma Wilson',
    'emma.w@email.com',
    '+1-555-0126',
    '{"line1": "321 Elm St", "city": "Houston", "state": "TX", "postal_code": "77001", "country": "USA"}',
    '{"line1": "321 Elm St", "city": "Houston", "state": "TX", "postal_code": "77001", "country": "USA"}',
    'processing',
    'pending',
    199.99,
    'USD',
    'Standard shipping'
),
(
    'ORD-005-2025',
    'David Lee',
    'david.l@email.com',
    '+1-555-0127',
    '{"line1": "654 Maple Ave", "city": "Seattle", "state": "WA", "postal_code": "98101", "country": "USA"}',
    '{"line1": "654 Maple Ave", "city": "Seattle", "state": "WA", "postal_code": "98101", "country": "USA"}',
    'cancelled',
    'failed',
    89.99,
    'USD',
    'Order cancelled by customer'
);

-- Insert order items
-- First, let's make sure we have some items in the inventory
INSERT INTO items (
    name,
    description,
    sku,
    unit_price,
    current_stock,
    reorder_point,
    category
) VALUES
(
    'Premium Laptop',
    '15-inch High Performance Laptop',
    'LAP-001',
    999.99,
    50,
    10,
    'Electronics'
),
(
    'Wireless Mouse',
    'Ergonomic Wireless Mouse',
    'MOU-001',
    29.99,
    100,
    20,
    'Accessories'
),
(
    'Noise-Canceling Headphones',
    'Over-ear Bluetooth Headphones',
    'HEAD-001',
    199.99,
    30,
    5,
    'Electronics'
),
(
    'Mechanical Keyboard',
    'RGB Mechanical Gaming Keyboard',
    'KEY-001',
    149.99,
    40,
    8,
    'Accessories'
),
(
    'USB-C Dock',
    '12-in-1 USB-C Docking Station',
    'DOCK-001',
    89.99,
    25,
    5,
    'Accessories'
) ON CONFLICT (sku) DO NOTHING;

-- Now let's add items to the orders
INSERT INTO ecommerce_order_items (
    order_id,
    item_id,
    quantity,
    unit_price,
    subtotal
)
SELECT 
    o.id,
    i.id,
    CASE 
        WHEN i.name = 'Premium Laptop' THEN 1
        WHEN i.name = 'Wireless Mouse' THEN 2
        WHEN i.name = 'Noise-Canceling Headphones' THEN 1
        ELSE 1
    END as quantity,
    i.unit_price,
    i.unit_price * CASE 
        WHEN i.name = 'Premium Laptop' THEN 1
        WHEN i.name = 'Wireless Mouse' THEN 2
        WHEN i.name = 'Noise-Canceling Headphones' THEN 1
        ELSE 1
    END as subtotal
FROM ecommerce_orders o
CROSS JOIN items i
WHERE o.external_order_id IN ('ORD-001-2025', 'ORD-002-2025', 'ORD-003-2025', 'ORD-004-2025', 'ORD-005-2025')
AND i.name IN ('Premium Laptop', 'Wireless Mouse', 'Noise-Canceling Headphones', 'Mechanical Keyboard', 'USB-C Dock')
LIMIT 10;
