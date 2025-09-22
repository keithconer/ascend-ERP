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
