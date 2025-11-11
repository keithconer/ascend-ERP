-- Create supply_chain_plans table
CREATE TABLE IF NOT EXISTS public.supply_chain_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  plan_id text NOT NULL UNIQUE,
  product_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  forecast_demand integer NOT NULL,
  plan_status text NOT NULL DEFAULT 'pending'::text CHECK (plan_status = ANY (ARRAY['pending'::text, 'approved'::text, 'delayed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT supply_chain_plans_pkey PRIMARY KEY (id),
  CONSTRAINT supply_chain_plans_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.items(id),
  CONSTRAINT supply_chain_plans_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT supply_chain_plans_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id)
);

-- Create routing_management table
CREATE TABLE IF NOT EXISTS public.routing_management (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  route_id text NOT NULL UNIQUE,
  source_warehouse_id uuid NOT NULL,
  destination_supplier_id uuid NOT NULL,
  distance_km numeric,
  vehicle_assigned text,
  departure_time timestamp with time zone,
  expected_arrival_time timestamp with time zone,
  route_status text NOT NULL DEFAULT 'scheduled'::text CHECK (route_status = ANY (ARRAY['scheduled'::text, 'in_transit'::text, 'delivered'::text, 'delayed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT routing_management_pkey PRIMARY KEY (id),
  CONSTRAINT routing_management_source_warehouse_id_fkey FOREIGN KEY (source_warehouse_id) REFERENCES public.warehouses(id),
  CONSTRAINT routing_management_destination_supplier_id_fkey FOREIGN KEY (destination_supplier_id) REFERENCES public.suppliers(id)
);

-- Create demand_forecasting table
CREATE TABLE IF NOT EXISTS public.demand_forecasting (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  forecast_id text NOT NULL UNIQUE,
  product_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  forecast_period_start date NOT NULL,
  forecast_period_end date NOT NULL,
  predicted_demand integer NOT NULL,
  actual_demand integer,
  accuracy_percentage numeric,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT demand_forecasting_pkey PRIMARY KEY (id),
  CONSTRAINT demand_forecasting_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.items(id),
  CONSTRAINT demand_forecasting_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id)
);

-- Enable RLS on all supply chain tables
ALTER TABLE public.supply_chain_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasting ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for supply chain tables
CREATE POLICY "Allow all operations on supply_chain_plans" ON public.supply_chain_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on routing_management" ON public.routing_management FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on demand_forecasting" ON public.demand_forecasting FOR ALL USING (true) WITH CHECK (true);

-- Create function to generate plan IDs
CREATE OR REPLACE FUNCTION public.generate_plan_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  new_id text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(plan_id FROM 'PLAN-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.supply_chain_plans;
  
  new_id := 'PLAN-' || LPAD(next_num::text, 3, '0');
  RETURN new_id;
END;
$$;

-- Create function to generate route IDs
CREATE OR REPLACE FUNCTION public.generate_route_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  new_id text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(route_id FROM 'RT-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.routing_management;
  
  new_id := 'RT-' || LPAD(next_num::text, 3, '0');
  RETURN new_id;
END;
$$;

-- Create function to generate forecast IDs
CREATE OR REPLACE FUNCTION public.generate_forecast_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num integer;
  new_id text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(forecast_id FROM 'FC-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.demand_forecasting;
  
  new_id := 'FC-' || LPAD(next_num::text, 3, '0');
  RETURN new_id;
END;
$$;

-- Create triggers to auto-generate IDs
CREATE OR REPLACE FUNCTION public.set_plan_id_before_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.plan_id IS NULL OR NEW.plan_id = '' THEN
    NEW.plan_id := generate_plan_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_route_id_before_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.route_id IS NULL OR NEW.route_id = '' THEN
    NEW.route_id := generate_route_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_forecast_id_before_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.forecast_id IS NULL OR NEW.forecast_id = '' THEN
    NEW.forecast_id := generate_forecast_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_plan_id_trigger
BEFORE INSERT ON public.supply_chain_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_plan_id_before_insert();

CREATE TRIGGER set_route_id_trigger
BEFORE INSERT ON public.routing_management
FOR EACH ROW
EXECUTE FUNCTION public.set_route_id_before_insert();

CREATE TRIGGER set_forecast_id_trigger
BEFORE INSERT ON public.demand_forecasting
FOR EACH ROW
EXECUTE FUNCTION public.set_forecast_id_before_insert();