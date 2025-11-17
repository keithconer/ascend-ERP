// Module to Table Mapping Configuration
// Maps ERP modules to their corresponding Supabase tables and columns

import { ModuleMapping, ModuleInfo, ModuleKey } from "@/components/reports&business_intelligence/types/bi";

export const MODULE_INFO: Record<ModuleKey, ModuleInfo> = {
  all: {
      id: "all",
      name: "All Modules",
      description: "Overview of all module activities",
      icon: "layout-dashboard",
      color: "hsl(var(--primary))",
      columns: undefined
  },
  inventory: {
      id: "inventory",
      name: "Inventory Management",
      description: "Stock levels, warehouses, and inventory transactions",
      icon: "package",
      color: "hsl(210, 100%, 50%)",
      columns: undefined
  },
  customer_service: {
      id: "customer_service",
      name: "Customer Service",
      description: "Support tickets, issues, and customer interactions",
      icon: "headphones",
      color: "hsl(340, 100%, 50%)",
      columns: undefined
  },
  procurement: {
      id: "procurement",
      name: "Procurement",
      description: "Purchase orders, requisitions, and supplier management",
      icon: "shopping-cart",
      color: "hsl(280, 100%, 50%)",
      columns: undefined
  },
  supply_chain: {
      id: "supply_chain",
      name: "Supply Chain",
      description: "Logistics, routing, and demand forecasting",
      icon: "truck",
      color: "hsl(30, 100%, 50%)",
      columns: undefined
  },
  finance: {
      id: "finance",
      name: "Finance",
      description: "Accounts payable/receivable, payroll, and transactions",
      icon: "dollar-sign",
      color: "hsl(120, 100%, 40%)",
      columns: undefined
  },
  project_management: {
      id: "project_management",
      name: "Project Management",
      description: "Projects, tasks, timelines, and resource allocation",
      icon: "briefcase",
      color: "hsl(200, 100%, 45%)",
      columns: undefined
  },
  hr: {
      id: "hr",
      name: "Human Resources",
      description: "Employee records, departments, and attendance",
      icon: "users",
      color: "hsl(260, 100%, 55%)",
      columns: undefined
  },
  sales: {
      id: "sales",
      name: "Sales",
      description: "Sales orders, leads, and revenue tracking",
      icon: "trending-up",
      color: "hsl(150, 100%, 45%)",
      columns: undefined
  },
};

export const MODULE_TABLE_MAPPING: ModuleMapping = {
  // Module 1: Inventory Management
  inventory: {
    primary: "inventory",
    related: ["inventory_alerts", "stock_transactions", "warehouses", "items", "categories"],
    columns: {
      display: ["items(name)", "warehouses(name)", "available_quantity", "updated_at", ],
      aggregate: ["quantity", "value"],
    },
    joins: [
      {
        table: "warehouses",
        on: "inventory.warehouse_id = warehouses.id",
        select: ["name"],
      },
      {
        table: "items",
        on: "inventory.item_id = items.id",
        select: ["name"],
      },
    ],
  },

  // Module 2: Customer Service
  customer_service: {
    primary: "customer_tickets",
    related: ["customer_issues", "customer_solutions", "customers"],
    columns: {
      display: ["ticker_id", "customer_id", "customer_name", "priority", "status",],
      aggregate: ["id"],
    },
    joins: [
      {
        table: "customers",
        on: "customer_tickets.customer_id = customers.id",
        select: ["name as customer_name"],
      },
    ],
  },

  // Module 3: Procurement
  procurement: {
    primary: "purchase_orders",
    related: ["purchase_order_items", "purchase_requisitions", "purchase_requisition_items", "suppliers", "quotations"],
    columns: {
      display: ["id", "order_id", "supplier_id", "status", "total_amount", "order_date"],
      aggregate: ["total_amount"],
    },
    joins: [
      {
        table: "suppliers",
        on: "purchase_orders.supplier_id = suppliers.id",
        select: ["name as supplier_name"],
      },
    ],
  },

  // Module 4: Supply Chain
  supply_chain: {
    primary: "supply_chain_plans",
    related: ["routing_management", "demand_forecasting", "goods_receipts"],
    columns: {
      display: ["id", "plan_name", "status", "start_date", "end_date"],
      aggregate: ["id"],
    },
  },

  // Module 5: Finance
  finance: {
    primary: "accounts_receivable",
    related: ["accounts_payable", "payroll"],
    columns: {
      display: ["id", "invoice_id", "unit_price", "total_amount",  "invoice_date", "payment_status"],
      aggregate: ["amount"],
    },
  },

  // Module 8: Project Management
  project_management: {
    primary: "projects",
    related: ["project_tasks", "project_timelines", "project_resources"],
    columns: {
      display: ["id", "name", "status", "start_date", "end_date", "budget"],
      aggregate: ["budget"],
    },
  },

  // Module 9: Human Resources
  hr: {
    primary: "employees",
    related: ["departments", "attendance"],
    columns: {
      display: ["id", "first_name", "last_name", "departments(name)", "position", "rate_per_day", "hire_date"],
      aggregate: ["salary"],
    },
    joins: [
      {
        table: "departments",
        on: "employees.department_id = departments.id",
        select: ["name"],
      },
    ],
  },

  // Module 10: Sales
  sales: {
    primary: "sales_orders",
    related: ["leads", "customers", "items"],
    columns: {
      display: ["order_id", "customers(customer_name)", "items(name)", "demand_quantity", "total_amount", "delivery_status", "order_date"],
      aggregate: ["amount"],
    },
    
  },

  // All modules view
  all: {
    primary: "inventory", // Fallback - will be handled specially
    columns: {
      display: ["id", "module", "type", "status", "date", "records"],
    },
  },
};

// Helper function to get module configuration
export const getModuleConfig = (moduleKey: ModuleKey) => {
  return MODULE_TABLE_MAPPING[moduleKey];
};

// Helper function to get all active modules
export const getActiveModules = (): ModuleKey[] => {
  return Object.keys(MODULE_TABLE_MAPPING).filter(
    (key) => key !== "all"
  ) as ModuleKey[];
};
