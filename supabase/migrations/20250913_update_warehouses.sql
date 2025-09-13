-- Update warehouses table
DO $$ 
BEGIN
    -- Add is_default column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'warehouses' 
        AND column_name = 'is_default'
    ) THEN
        ALTER TABLE warehouses
        ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Ensure at least one default warehouse exists
    IF NOT EXISTS (SELECT 1 FROM warehouses WHERE is_default = true) THEN
        WITH first_warehouse AS (
            SELECT id FROM warehouses LIMIT 1
        )
        UPDATE warehouses w
        SET is_default = true
        FROM first_warehouse fw
        WHERE w.id = fw.id;
        
        -- If no warehouses exist, create a default one
        IF NOT FOUND THEN
            INSERT INTO warehouses (name, code, is_default)
            VALUES ('Main Warehouse', 'MAIN', true);
        END IF;
    END IF;
END $$;
