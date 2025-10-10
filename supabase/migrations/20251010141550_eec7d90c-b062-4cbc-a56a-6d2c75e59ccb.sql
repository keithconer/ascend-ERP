-- Add demand_quantity column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS demand_quantity integer DEFAULT 1;

COMMENT ON COLUMN leads.demand_quantity IS 'Quantity demanded by the customer for this lead';