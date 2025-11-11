export type LeadStatus = 'new' | 'qualified' | 'converted';

export type Lead = {
  lead_id: number;
  customer_name: string;
  contact_info: string;
  product_id: string;
  lead_status: LeadStatus;
  assigned_to: number;
  demand_quantity?: number;
  available_stock?: number;
  unit_price?: number;
  created_at?: string;
  updated_at?: string;
};

export type Product = {
  id: string;
  name: string;
  unit_price: number;
  sku?: string;
  description?: string;
};

export type Employee = {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  department_id?: number;
  position: string;
  phone_number?: string;
  hire_date?: string;
  employee_type?: string;
  rate_per_day?: number;
  work_days_per_week?: number;
  created_at?: string;
  updated_at?: string;
};

export type Department = {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
};

export type Inventory = {
  item_id: string;
  warehouse_id: string;
  quantity: number;
  available_quantity?: number;
  reserved_quantity?: number;
};

export type Quotation = {
  quotation_id: number;
  lead_id: number;
  customer_name: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: string;
  assigned_to?: number;
  created_at?: string;
  updated_at?: string;
};
