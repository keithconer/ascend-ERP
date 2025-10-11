-- Create customers table with auto-generated customer IDs
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text UNIQUE NOT NULL,
  customer_name text NOT NULL UNIQUE,
  contact_info text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create sales_orders table
CREATE TABLE IF NOT EXISTS public.sales_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT,
  product_id uuid REFERENCES public.items(id) ON DELETE RESTRICT,
  demand_quantity integer NOT NULL,
  total_amount numeric NOT NULL,
  payment_terms text DEFAULT 'credit',
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'processed', 'delivered', 'complete')),
  assigned_staff integer REFERENCES public.employees(id),
  quotation_id integer REFERENCES public.quotations(quotation_id) ON DELETE SET NULL,
  lead_id integer REFERENCES public.leads(lead_id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create accounts_receivable table
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id text UNIQUE NOT NULL,
  sales_order_id uuid REFERENCES public.sales_orders(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT,
  total_amount numeric NOT NULL,
  unit_price numeric NOT NULL,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue')),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Function to generate unique customer ID
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_id text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_id FROM 'CUST-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.customers;
  
  new_id := 'CUST-' || LPAD(next_num::text, 2, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique order ID
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_id text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_id FROM 'OD-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.sales_orders;
  
  new_id := 'OD-' || LPAD(next_num::text, 2, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique invoice ID
CREATE OR REPLACE FUNCTION generate_invoice_id()
RETURNS text AS $$
DECLARE
  next_num integer;
  new_id text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_id FROM 'INV-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.accounts_receivable;
  
  new_id := 'INV-' || LPAD(next_num::text, 2, '0');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check customer credit status
CREATE OR REPLACE FUNCTION check_customer_credit_status(p_customer_id uuid)
RETURNS TABLE(has_unpaid boolean, unpaid_count integer) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) > 0 AS has_unpaid,
    COUNT(*)::INTEGER AS unpaid_count
  FROM accounts_receivable
  WHERE customer_id = p_customer_id
  AND payment_status = 'unpaid';
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update inventory when payment is marked as paid
CREATE OR REPLACE FUNCTION update_inventory_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Update sales order status
    UPDATE sales_orders
    SET delivery_status = 'complete'
    WHERE id = NEW.sales_order_id;

    -- Get sales order details
    WITH so AS (
      SELECT product_id, demand_quantity
      FROM sales_orders
      WHERE id = NEW.sales_order_id
    )
    -- Update inventory
    UPDATE inventory
    SET quantity = quantity - so.demand_quantity,
        available_quantity = available_quantity - so.demand_quantity
    FROM so
    WHERE inventory.item_id = so.product_id;

    -- Insert stock transaction
    INSERT INTO stock_transactions (
      item_id,
      warehouse_id,
      transaction_type,
      quantity,
      reference_number,
      unit_cost,
      total_cost,
      created_by
    )
    SELECT 
      so.product_id,
      (SELECT id FROM warehouses LIMIT 1), -- Assuming default warehouse
      'stock-out',
      so.demand_quantity,
      NEW.invoice_id,
      ar.unit_price,
      ar.total_amount,
      (SELECT id FROM employees LIMIT 1) -- Assuming default employee
    FROM so
    JOIN accounts_receivable ar ON ar.sales_order_id = NEW.sales_order_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_inventory_on_payment ON accounts_receivable;
CREATE TRIGGER trigger_update_inventory_on_payment
AFTER UPDATE ON accounts_receivable
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_payment();

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sales_orders" ON public.sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on accounts_receivable" ON public.accounts_receivable FOR ALL USING (true) WITH CHECK (true);