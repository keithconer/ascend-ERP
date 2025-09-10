-- Create ERP Inventory Management System Database Schema

-- Categories table for organizing inventory items
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Warehouses/Locations table
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  address TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Items/Products table
CREATE TABLE public.items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  unit_price DECIMAL(10,2) DEFAULT 0,
  unit_of_measure TEXT DEFAULT 'pcs',
  min_threshold INTEGER DEFAULT 0,
  max_threshold INTEGER DEFAULT 1000,
  expiration_tracking BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock/Inventory tracking per warehouse
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  last_counted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id, warehouse_id)
);

-- Stock transactions table
CREATE TABLE public.stock_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('stock-in', 'stock-out', 'transfer', 'adjustment')),
  quantity INTEGER NOT NULL,
  reference_number TEXT,
  notes TEXT,
  expiration_date DATE,
  unit_cost DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT -- Will store user info when auth is implemented
);

-- Inventory alerts table
CREATE TABLE public.inventory_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'expiring_soon')),
  message TEXT NOT NULL,
  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (will be restricted when auth is implemented)
CREATE POLICY "Allow all operations on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on warehouses" ON public.warehouses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_transactions" ON public.stock_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_alerts" ON public.inventory_alerts FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically update inventory quantities after stock transactions
CREATE OR REPLACE FUNCTION public.update_inventory_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different transaction types
  IF NEW.transaction_type IN ('stock-in', 'adjustment') THEN
    -- Increase inventory
    INSERT INTO public.inventory (item_id, warehouse_id, quantity)
    VALUES (NEW.item_id, NEW.warehouse_id, NEW.quantity)
    ON CONFLICT (item_id, warehouse_id)
    DO UPDATE SET 
      quantity = inventory.quantity + NEW.quantity,
      updated_at = now();
  
  ELSIF NEW.transaction_type = 'stock-out' THEN
    -- Decrease inventory
    INSERT INTO public.inventory (item_id, warehouse_id, quantity)
    VALUES (NEW.item_id, NEW.warehouse_id, -NEW.quantity)
    ON CONFLICT (item_id, warehouse_id)
    DO UPDATE SET 
      quantity = GREATEST(0, inventory.quantity - NEW.quantity),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic inventory updates
CREATE TRIGGER update_inventory_after_stock_transaction
  AFTER INSERT ON public.stock_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_after_transaction();

-- Function to generate inventory alerts
CREATE OR REPLACE FUNCTION public.check_inventory_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for low stock alerts
  INSERT INTO public.inventory_alerts (item_id, warehouse_id, alert_type, message)
  SELECT 
    i.item_id,
    i.warehouse_id,
    'low_stock',
    'Item ' || it.name || ' in ' || w.name || ' is below minimum threshold (' || i.quantity || ' < ' || it.min_threshold || ')'
  FROM public.inventory i
  JOIN public.items it ON i.item_id = it.id
  JOIN public.warehouses w ON i.warehouse_id = w.id
  WHERE i.item_id = NEW.item_id 
    AND i.warehouse_id = NEW.warehouse_id
    AND i.quantity <= it.min_threshold
    AND i.quantity > 0
    AND NOT EXISTS (
      SELECT 1 FROM public.inventory_alerts a 
      WHERE a.item_id = i.item_id 
        AND a.warehouse_id = i.warehouse_id 
        AND a.alert_type = 'low_stock' 
        AND a.is_acknowledged = false
    );
  
  -- Check for out of stock alerts
  INSERT INTO public.inventory_alerts (item_id, warehouse_id, alert_type, message)
  SELECT 
    i.item_id,
    i.warehouse_id,
    'out_of_stock',
    'Item ' || it.name || ' in ' || w.name || ' is out of stock'
  FROM public.inventory i
  JOIN public.items it ON i.item_id = it.id
  JOIN public.warehouses w ON i.warehouse_id = w.id
  WHERE i.item_id = NEW.item_id 
    AND i.warehouse_id = NEW.warehouse_id
    AND i.quantity = 0
    AND NOT EXISTS (
      SELECT 1 FROM public.inventory_alerts a 
      WHERE a.item_id = i.item_id 
        AND a.warehouse_id = i.warehouse_id 
        AND a.alert_type = 'out_of_stock' 
        AND a.is_acknowledged = false
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic alert generation
CREATE TRIGGER check_inventory_alerts_trigger
  AFTER INSERT OR UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.check_inventory_alerts();

-- Insert sample data
INSERT INTO public.categories (name, description) VALUES
  ('Electronics', 'Electronic components and devices'),
  ('Hardware', 'Physical hardware items'),
  ('Software', 'Software licenses and digital products'),
  ('Office Supplies', 'General office supplies and stationery');

INSERT INTO public.warehouses (name, address, description) VALUES
  ('Main Warehouse', '123 Industrial Blvd, City, State', 'Primary storage facility'),
  ('Distribution Center', '456 Commerce Ave, City, State', 'Distribution and shipping center'),
  ('Retail Store', '789 Main St, City, State', 'Retail location inventory');

INSERT INTO public.items (sku, name, description, category_id, unit_price, unit_of_measure, min_threshold, max_threshold) VALUES
  ('ELEC-001', 'Wireless Mouse', 'Bluetooth wireless mouse', (SELECT id FROM public.categories WHERE name = 'Electronics'), 29.99, 'pcs', 10, 100),
  ('HARD-001', 'USB Cable', 'USB-C to USB-A cable', (SELECT id FROM public.categories WHERE name = 'Hardware'), 9.99, 'pcs', 25, 200),
  ('SOFT-001', 'Office License', 'Microsoft Office 365 License', (SELECT id FROM public.categories WHERE name = 'Software'), 129.99, 'license', 5, 50),
  ('OFF-001', 'A4 Paper', 'Premium A4 printing paper', (SELECT id FROM public.categories WHERE name = 'Office Supplies'), 12.99, 'ream', 20, 500);