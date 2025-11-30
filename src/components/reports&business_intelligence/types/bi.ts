// Business Intelligence Module Types
// Defines all data structures and interfaces for the BI system

export type ModuleKey = 
  | "all" 
  | "inventory" 
  | "customer_service" 
  | "procurement" 
  | "supply_chain" 
  | "finance" 
  | "ecommerce"
  | "business_intelligence"
  | "sales"
  | "project_management" 
  | "hr";

export interface ModuleInfo {
  columns: any;
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface TableConfig {
  primary: string;
  related?: string[];
  columns: {
    display: string[];
    aggregate?: string[];
  };
  joins?: {
    table: string;
    on: string;
    select: string[];
  }[];
  subtables?: {
    name: string;
    table: string;
    columns: {
      display: string[];
      aggregate?: string[];
    };
    joins?: {
      table: string;
      on: string;
      select: string[];
    }[];
  }[];
}

export interface ModuleMapping {
  [key: string]: TableConfig;
}

export interface AggregatedData {
  module: string;
  count: number;
  lastUpdated: string;
  summary: Record<string, any>;
  details: any[];
}

export interface ReportConfig {
  modules: ModuleKey[];
  dateRange?: {
    start: string;
    end: string;
  };
  aggregations?: string[];
  filters?: Record<string, any>;
}

// Inventory Module Types
export interface InventoryItem {
  id: string;
  item: string;
  quantity: number;
  location: string;
  value: number;
  category?: string;
  reorder_point?: number;
}

export interface StockTransaction {
  id: string;
  item_id: string;
  type: string;
  quantity: number;
  date: string;
  reference?: string;
}

// Customer Service Types
export interface CustomerTicket {
  id: string;
  customer_id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at?: string;
}

// Procurement Types
export interface PurchaseOrder {
  id: string;
  order_id: string;
  supplier_id: string;
  status: string;
  total_amount: number;
  order_date: string;
  delivery_date?: string;
}

// Finance Types
export interface FinancialTransaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  date: string;
  reference?: string;
}

// HR Types
export interface Employee {
  id: string;
  employee: string;
  department: string;
  status: string;
  salary: number;
  hire_date?: string;
}

// Sales Types
export interface SalesOrder {
  order_id: string;
  customer_id?: string;
  amount: number;
  status: string;
  order_date: string;
}

// Generic data row for dynamic tables
export interface DataRow {
  [key: string]: any;
}

export interface FetchResult {
  data: DataRow[];
  error: string | null;
  count: number;
  aggregations?: Record<string, any>;
}

// ==========================
// Date extractor helper
// ==========================
function extractDate(record: any) {
  const fields = [
    "updated_at",
    "created_at",
    "order_date",
    "invoice_date",
    "start_date",
    "hire_date",
  ];

  for (const f of fields) {
    if (record[f]) return record[f].split("T")[0];
  }

  return new Date().toISOString().split("T")[0]; // fallback
}
export { extractDate };