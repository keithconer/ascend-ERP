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
  ecommerce: {
      id: "ecommerce",
      name: "E-Commerce",
      description: "Online store, shopping carts, and orders",
      icon: "shopping-bag",
      color: "hsl(320, 100%, 50%)",
      columns: undefined
  },
  business_intelligence: {
      id: "business_intelligence",
      name: "Business Intelligence",
      description: "Reports, analytics, and business insights",
      icon: "bar-chart-2",
      color: "hsl(50, 100%, 50%)",
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
      display: ["items(name)", "warehouses(name)", "available_quantity", "updated_at"],
      aggregate: ["quantity"],
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
    subtables: [
      {
        name: "Stock Transactions",
        table: "stock_transactions",
        columns: {
          display: ["id", "transaction_type", "quantity", "reference_number", "created_at"],
          aggregate: ["id"],
        },
        joins: [],
      },
      {
        name: "Active Warehouses",
        table: "warehouses",
        columns: {
          display: ["id", "name", "location", "capacity", "updated_at"],
          aggregate: ["id"],
        },
        joins: [],
      },
    ],
  },

  // Module 2: Customer Service
  customer_service: {
    primary: "customer_issues",
    related: ["customer_tickets", "customer_solutions", "customers"],
    columns: {
      display: ["id", "issue_id", "issue_type", "status", "updated_at"],
      aggregate: ["id"],
    },
    joins: [],
  },

  // Module 3: Procurement
  procurement: {
    primary: "purchase_orders",
    related: ["purchase_order_items", "purchase_requisitions", "suppliers"],
    columns: {
      display: ["id", "po_number", "suppliers(name)", "status", "total", "order_date"],
      aggregate: ["id"],
    },
    joins: [
      {
        table: "suppliers",
        on: "purchase_orders.supplier_id = suppliers.id",
        select: ["name"],
      },
    ],
    subtables: [
      {
        name: "Purchase Order Items",
        table: "purchase_order_items",
        columns: {
          display: ["id", "purchase_order_id", "items(name)", "quantity", "price", "created_at"],
          
        },
        joins: [
          {
            table: "items",
            on: "purchase_order_items.item_id = items.id",
            select: ["name"],
          },
        ],
      },
      {
        name: "Goods Receipts",
        table: "goods_receipts",
        columns: {
          display: ["id", "gr_number", "invoice_number", "status", "created_at"],
          
        },
        joins: [],
      },
    ],
  },

  // Module 4: Supply Chain
  supply_chain: {
    primary: "demand_forecasting",
    related: ["routing_management", "supply_chain_plans"],
    columns: {
      display: ["id", "forecast_id", "predicted_demand", "lead_time", "recommend_order_qty", "created_at"],
      
    },
    joins: [],
  },

  // Module 5: Finance
  finance: {
    primary: "accounts_receivable",
    related: ["accounts_payable"],
    columns: {
      display: ["invoice_id", "customers(customer_name)", "total_amount", "payment_status", "invoice_date"],
      
    },
    joins: [
      {
        table: "customers",
        on: "accounts_receivable.customer_id = customers.id",
        select: ["customer_name"],
      },
    ],
  },

  // Module 6: E-Commerce
  ecommerce: {
    primary: "sales_orders",
    related: ["customers"],
    columns: {
      display: ["order_id", "customers(customer_name)", "total_amount", "delivery_status", "order_date"],
      
    },
    joins: [
      {
        table: "customers",
        on: "sales_orders.customer_id = customers.id",
        select: ["customer_name"],
      },
    ],
  },

  

  // Module 8: Project Management
  project_management: {
    primary: "projects",
    related: ["project_tasks", "project_timelines", "project_resources"],
    columns: {
      display: ["id", "project_code", "project_name", "project_cost", "estimated_end_date", "status"],
      
    },
    joins: [],
  },

  // Module 9: Human Resources
  hr: {
    primary: "employees",
    related: ["departments", "attendance"],
    columns: {
      display: ["id", "first_name", "last_name", "departments(name)", "position", "hire_date"],
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
    related: ["leads", "customers"],
    columns: {
      display: ["order_id", "customers(customer_name)", "total_amount", "delivery_status", "order_date"],
      aggregate: ["total_amount"],
    },
    joins: [
      {
        table: "customers",
        on: "sales_orders.customer_id = customers.id",
        select: ["customer_name"],
      },
    ],
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
    (key) => key !== "all" && key !== "business_intelligence"
  ) as ModuleKey[];
};
