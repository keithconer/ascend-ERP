-- Suppliers Table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_info TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Requisitions
CREATE TABLE public.purchase_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT,
  requested_by TEXT NOT NULL,
  request_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase Requisition Items (Join table)
CREATE TABLE public.purchase_requisition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID NOT NULL REFERENCES public.purchase_requisitions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Purchase Orders
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requisition_id UUID REFERENCES public.purchase_requisitions(id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase Order Items
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Open Access Policies for Dev
CREATE POLICY "Allow all on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on requisitions" ON public.purchase_requisitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on requisition items" ON public.purchase_requisition_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on order items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);
