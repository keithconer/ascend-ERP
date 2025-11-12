-- Update demand_forecasting table structure
ALTER TABLE public.demand_forecasting
DROP COLUMN IF EXISTS warehouse_id,
DROP COLUMN IF EXISTS forecast_period_start,
DROP COLUMN IF EXISTS forecast_period_end,
DROP COLUMN IF EXISTS actual_demand,
DROP COLUMN IF EXISTS accuracy_percentage;

ALTER TABLE public.demand_forecasting
ADD COLUMN IF NOT EXISTS lead_time integer,
ADD COLUMN IF NOT EXISTS recommend_order_qty integer;

-- Update supply_chain_plans table to include PO and requisition references
ALTER TABLE public.supply_chain_plans
ADD COLUMN IF NOT EXISTS po_number text,
ADD COLUMN IF NOT EXISTS requisition_id uuid;

-- Add foreign key constraints
ALTER TABLE public.supply_chain_plans
ADD CONSTRAINT supply_chain_plans_po_number_fkey 
FOREIGN KEY (po_number) REFERENCES public.purchase_orders(po_number) ON DELETE SET NULL;

ALTER TABLE public.supply_chain_plans
ADD CONSTRAINT supply_chain_plans_requisition_id_fkey 
FOREIGN KEY (requisition_id) REFERENCES public.purchase_requisitions(id) ON DELETE SET NULL;

-- Create function to sync status updates from supply chain planning to procurement
CREATE OR REPLACE FUNCTION public.sync_supply_chain_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update purchase order status if plan status is delayed
  IF NEW.plan_status = 'delayed' AND NEW.po_number IS NOT NULL THEN
    UPDATE public.purchase_orders
    SET status = 'delayed',
        updated_at = now()
    WHERE po_number = NEW.po_number;
    
    -- Update corresponding goods receipt status
    UPDATE public.goods_receipts gr
    SET status = 'delayed'
    FROM public.purchase_orders po
    WHERE gr.po_id = po.id
      AND po.po_number = NEW.po_number
      AND gr.status != 'delayed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for supply chain status sync
DROP TRIGGER IF EXISTS sync_status_on_supply_chain_update ON public.supply_chain_plans;
CREATE TRIGGER sync_status_on_supply_chain_update
  AFTER UPDATE OF plan_status ON public.supply_chain_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_supply_chain_status();

-- Create function to sync status updates from purchase orders to goods receipts
CREATE OR REPLACE FUNCTION public.sync_po_status_to_gr()
RETURNS TRIGGER AS $$
BEGIN
  -- Update goods receipt status when PO status changes to delayed
  IF NEW.status = 'delayed' AND (OLD.status IS NULL OR OLD.status != 'delayed') THEN
    UPDATE public.goods_receipts
    SET status = 'delayed'
    WHERE po_id = NEW.id
      AND status != 'delayed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for PO to GR status sync
DROP TRIGGER IF EXISTS sync_po_status_to_gr_trigger ON public.purchase_orders;
CREATE TRIGGER sync_po_status_to_gr_trigger
  AFTER UPDATE OF status ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_po_status_to_gr();