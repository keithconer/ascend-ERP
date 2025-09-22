-- Purchase Requisitions Table
create table if not exists public.purchase_requisitions (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  requested_by text not null,
  status text check (status in ('PENDING', 'APPROVED', 'IN-PROGRESS', 'REJECTED')) default 'PENDING',
  required_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Purchase Orders Table
create table if not exists public.purchase_orders (
  id bigint generated always as identity primary key,
  supplier_name text not null,
  total_amount numeric(12, 2) not null,
  status text check (status in ('PENDING', 'APPROVED', 'IN-PROGRESS', 'REJECTED')) default 'PENDING',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Goods Receipts Table
create table if not exists public.goods_receipts (
  id bigint generated always as identity primary key,
  purchase_order_id bigint references public.purchase_orders(id) on delete cascade,
  received_by text not null,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Suppliers Table
create table if not exists public.suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  contact_info text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optional: Add indexes for performance (especially for foreign keys or frequently queried fields)
create index if not exists idx_purchase_requisitions_status on public.purchase_requisitions (status);
create index if not exists idx_purchase_orders_status on public.purchase_orders (status);
create index if not exists idx_goods_receipts_po_id on public.goods_receipts (purchase_order_id);
create index if not exists idx_suppliers_is_active on public.suppliers (is_active);



-- ================================================
-- 🔁 Trigger: Auto-create Stock Transaction on Goods Receipt
-- ================================================

-- Step 1: Add column to goods_receipts to hold item_id and quantity (for now, single item per receipt)
ALTER TABLE public.goods_receipts
ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES public.items(id),
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 0;

-- Step 2: Function to insert into stock_transactions after goods_receipts insert
CREATE OR REPLACE FUNCTION public.create_stock_transaction_from_goods_receipt()
RETURNS TRIGGER AS $$
DECLARE
  default_warehouse_id uuid;
BEGIN
  -- Fetch the default warehouse
  SELECT id INTO default_warehouse_id
  FROM public.warehouses
  WHERE is_default = true
  LIMIT 1;

  -- If we don't have a default warehouse, exit
  IF default_warehouse_id IS NULL THEN
    RAISE EXCEPTION 'No default warehouse found. Cannot create stock transaction.';
  END IF;

  -- Insert stock-in transaction
  INSERT INTO public.stock_transactions (
    item_id,
    warehouse_id,
    transaction_type,
    quantity,
    reference_number,
    notes,
    unit_cost,
    total_cost,
    created_by
  ) VALUES (
    NEW.item_id,
    default_warehouse_id,
    'stock-in',
    NEW.quantity,
    NEW.purchase_order_id::text, -- reference number
    'Auto-created from Goods Receipt ID ' || NEW.id,
    NULL, -- unit cost (can be populated later)
    NULL, -- total cost
    NEW.received_by -- created_by (may replace with user ID later)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Trigger to call function after insert
DROP TRIGGER IF EXISTS trg_create_stock_transaction_from_goods_receipt ON public.goods_receipts;

CREATE TRIGGER trg_create_stock_transaction_from_goods_receipt
AFTER INSERT ON public.goods_receipts
FOR EACH ROW
WHEN (NEW.is_verified = true)
EXECUTE FUNCTION public.create_stock_transaction_from_goods_receipt();
