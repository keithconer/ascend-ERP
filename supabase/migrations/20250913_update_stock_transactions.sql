-- Add reference_id column to stock_transactions table if it doesn't exist
DO $$ 
BEGIN
    -- First check if the column doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stock_transactions' 
        AND column_name = 'reference_id'
    ) THEN
        ALTER TABLE stock_transactions
        ADD COLUMN reference_id UUID;
    END IF;

    -- Add index for better performance
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_stock_transactions_reference'
        AND n.nspname = 'public'
    ) THEN
        CREATE INDEX idx_stock_transactions_reference ON stock_transactions(reference_id);
    END IF;

    -- Add type for transaction_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_type 
        WHERE typname = 'transaction_type'
    ) THEN
        CREATE TYPE transaction_type AS ENUM ('purchase', 'sale', 'adjustment', 'transfer');
        
        -- Add transaction_type column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'stock_transactions' 
            AND column_name = 'transaction_type'
        ) THEN
            ALTER TABLE stock_transactions
            ADD COLUMN transaction_type transaction_type NOT NULL DEFAULT 'adjustment';
        END IF;
    END IF;
END $$;
