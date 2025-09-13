-- Add better error handling and logging to the sync trigger
CREATE OR REPLACE FUNCTION sync_order_with_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the start of sync
    INSERT INTO ecommerce_sync_events (order_id, event_type, status, message)
    VALUES (NEW.id, 'SYNC_START', 'processing', 'Starting order sync process');

    BEGIN
        -- Update inventory quantities
        WITH updated_items AS (
            UPDATE items i
            SET current_stock = i.current_stock - oi.quantity
            FROM ecommerce_order_items oi
            WHERE i.id = oi.item_id
            AND oi.order_id = NEW.id
            RETURNING i.id, i.current_stock, oi.quantity
        )
        INSERT INTO ecommerce_sync_events (order_id, event_type, status, message)
        SELECT 
            NEW.id,
            'STOCK_UPDATE',
            'success',
            format('Updated stock for item %s: %s - %s = %s', 
                   id,
                   current_stock + quantity,
                   quantity,
                   current_stock)
        FROM updated_items;

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
            COALESCE((SELECT id FROM warehouses WHERE is_default = true LIMIT 1),
                     (SELECT id FROM warehouses LIMIT 1)), -- Try default warehouse first
            oi.quantity * -1, -- Negative for outgoing stock
            'sale'::transaction_type,
            NEW.id,
            'E-commerce order: ' || NEW.external_order_id
        FROM ecommerce_order_items oi
        WHERE oi.order_id = NEW.id;

        -- Log successful completion
        INSERT INTO ecommerce_sync_events (order_id, event_type, status, message)
        VALUES (NEW.id, 'SYNC_COMPLETE', 'success', 'Order sync completed successfully');

        -- Update order sync status
        UPDATE ecommerce_orders
        SET sync_status = 'synced'
        WHERE id = NEW.id;

    EXCEPTION WHEN OTHERS THEN
        -- Log the error
        INSERT INTO ecommerce_sync_events (order_id, event_type, status, message)
        VALUES (NEW.id, 'ERROR', 'failed', 'Error during sync: ' || SQLERRM);
        
        -- Update order sync status
        UPDATE ecommerce_orders
        SET sync_status = 'failed'
        WHERE id = NEW.id;
        
        -- Re-raise the error
        RAISE;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
