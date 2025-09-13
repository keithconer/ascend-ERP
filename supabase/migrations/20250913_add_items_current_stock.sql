-- Add current_stock column to items table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'items' 
        AND column_name = 'current_stock'
    ) THEN
        ALTER TABLE items
        ADD COLUMN current_stock INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;
