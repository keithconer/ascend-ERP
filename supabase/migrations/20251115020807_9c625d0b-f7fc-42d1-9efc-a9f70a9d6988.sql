-- Make forecast_demand nullable with default 0 for supply_chain_plans
ALTER TABLE public.supply_chain_plans 
ALTER COLUMN forecast_demand SET DEFAULT 0,
ALTER COLUMN forecast_demand DROP NOT NULL;

-- Create function to sync routing status to supply chain and PO
CREATE OR REPLACE FUNCTION public.sync_routing_status_to_supply_chain()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- If routing status is delayed, update supply chain plan and PO
  IF NEW.route_status = 'delayed' AND NEW.plan_id IS NOT NULL THEN
    -- Update supply chain plan status
    UPDATE public.supply_chain_plans
    SET plan_status = 'delayed',
        updated_at = now()
    WHERE plan_id = NEW.plan_id
      AND plan_status != 'delayed';
    
    -- Update PO status through supply chain plan
    UPDATE public.purchase_orders po
    SET status = 'delayed',
        updated_at = now()
    FROM public.supply_chain_plans scp
    WHERE scp.plan_id = NEW.plan_id
      AND po.po_number = scp.po_number
      AND po.status != 'delayed';
      
    -- Update goods receipts status
    UPDATE public.goods_receipts gr
    SET status = 'delayed'
    FROM public.purchase_orders po, public.supply_chain_plans scp
    WHERE scp.plan_id = NEW.plan_id
      AND po.po_number = scp.po_number
      AND gr.po_id = po.id
      AND gr.status != 'delayed';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for routing status sync
DROP TRIGGER IF EXISTS sync_routing_status ON public.routing_management;
CREATE TRIGGER sync_routing_status
  AFTER INSERT OR UPDATE OF route_status ON public.routing_management
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_routing_status_to_supply_chain();