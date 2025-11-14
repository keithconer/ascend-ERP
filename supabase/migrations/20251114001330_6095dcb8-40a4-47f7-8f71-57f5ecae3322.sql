-- Add updated_at column to purchase_orders
ALTER TABLE public.purchase_orders 
ADD COLUMN updated_at timestamp with time zone DEFAULT now();

-- Add plan_id to demand_forecasting
ALTER TABLE public.demand_forecasting 
ADD COLUMN plan_id text;

-- Add plan_id to routing_management  
ALTER TABLE public.routing_management 
ADD COLUMN plan_id text;

-- Add foreign key constraints
ALTER TABLE public.demand_forecasting
ADD CONSTRAINT demand_forecasting_plan_id_fkey 
FOREIGN KEY (plan_id) REFERENCES public.supply_chain_plans(plan_id);

ALTER TABLE public.routing_management
ADD CONSTRAINT routing_management_plan_id_fkey 
FOREIGN KEY (plan_id) REFERENCES public.supply_chain_plans(plan_id);

-- Update trigger to sync forecast demand to supply chain plan
CREATE OR REPLACE FUNCTION sync_forecast_to_supply_chain()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan_id IS NOT NULL THEN
    UPDATE public.supply_chain_plans
    SET forecast_demand = NEW.recommend_order_qty,
        updated_at = now()
    WHERE plan_id = NEW.plan_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_forecast_on_insert_or_update
AFTER INSERT OR UPDATE OF recommend_order_qty ON public.demand_forecasting
FOR EACH ROW
EXECUTE FUNCTION sync_forecast_to_supply_chain();