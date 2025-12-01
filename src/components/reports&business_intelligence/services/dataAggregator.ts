// Business Intelligence Data Aggregation Service
// Handles unified data fetching, aggregation, and cross-module queries

import { supabase } from "@/integrations/supabase/client";
import { ModuleKey, FetchResult, DataRow, ReportConfig, AggregatedData } from "@/components/reports&business_intelligence/types/bi";
import { MODULE_TABLE_MAPPING, getActiveModules, MODULE_INFO } from "./moduleMapping";

/**
 * Unified data fetcher for a single module
 * Handles joins, column selection, and basic aggregations
 */
export const fetchModuleData = async (
  moduleKey: ModuleKey,
  options: {
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
    filters?: Record<string, any>;
    subtable?: string;
  } = {}
): Promise<FetchResult> => {
  const { limit, orderBy = "id", ascending = false, filters = {}, subtable } = options;
  const actualLimit = limit !== undefined ? limit : 10;

  console.log("fetchModuleData called with moduleKey:", moduleKey, "limit:", limit, "subtable:", subtable, "actualLimit:", actualLimit);

  // Special handling for "all" modules view
  if (moduleKey === "all") {
    return fetchAllModulesActivity(limit);
  }

  const config = MODULE_TABLE_MAPPING[moduleKey];
  if (!config) {
    return {
      data: [],
      error: `Module ${moduleKey} not found in configuration`,
      count: 0,
    };
  }

  try {
    // Check if subtable is requested
    let tableConfig = config;
    let tableToQuery = config.primary;
    
    if (subtable && config.subtables) {
      const subtableConfig = config.subtables.find(st => st.table === subtable);
      if (subtableConfig) {
        tableToQuery = subtable;
        // Create a temporary config-like object for the subtable
        tableConfig = {
          primary: subtable,
          columns: subtableConfig.columns,
          joins: subtableConfig.joins || [],
        };
      }
    }

    // Build the base query
    let query: any = supabase
      .from<any, any>(tableToQuery)
      .select(tableConfig.columns.display.join(", "), { count: "exact" });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering and limit
    query = query.order(orderBy, { ascending }).limit(actualLimit);

    const { data, error, count } = await query;

    if (error) {
      console.error(`Error fetching ${moduleKey} data:`, error);
      return {
        data: [],
        error: error.message,
        count: 0,
      };
    }

    // Compute aggregations if configured
    let aggregations = {};
    if (config.columns.aggregate && data) {
      aggregations = computeAggregations(data, config.columns.aggregate);
    }

    return {
      data: data || [],
      error: null,
      count: count || 0,
      aggregations,
    };
  } catch (err) {
    console.error(`Exception fetching ${moduleKey} data:`, err);
    return {
      data: [],
      error: String(err),
      count: 0,
    };
  }
};

/**
 * Fetch activity summary from all modules
 * Creates a unified view of recent activities across the ERP system
 */
export const fetchAllModulesActivity = async (limit?: number): Promise<FetchResult> => {
  const activeModules = getActiveModules();
  const activities: DataRow[] = [];

  console.log("fetchAllModulesActivity called with limit:", limit);

  try {
    // Fetch recent records from each module with actual columns
    for (const moduleKey of activeModules) {
      const config = MODULE_TABLE_MAPPING[moduleKey];
      const moduleInfo = MODULE_INFO[moduleKey];
      
      // Get display columns to fetch relevant data
      const columnsToSelect = config.columns.display.slice(0, 10).join(", ");

      const { data, count } = await supabase
        .from<any, any>(config.primary)
        .select(columnsToSelect, { count: "exact" })
        .order("id", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        data.forEach((record: any) => {
          // Extract status from various possible column names
          const status = record.status || record.delivery_status || record.payment_status || "Pending";
          
          // Extract date from various possible column names
          let date = record.created_at || record.order_date || record.updated_at || new Date().toISOString();
          if (typeof date === 'string' && date.includes('T')) {
            date = date.split('T')[0];
          }

          activities.push({
            id: `${moduleKey}-${record.id}`,
            module: moduleInfo.name,
            type: `${config.primary} record`,
            status: String(status).charAt(0).toUpperCase() + String(status).slice(1),
            date: date,
            records: count || 0,
          });
        });
      }
    }

    // Sort by date descending (most recent first)
    activities.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // If limit is undefined, return all; otherwise limit the results
    const displayData = limit !== undefined ? activities.slice(0, limit) : activities;

    return {
      data: displayData,
      error: null,
      count: activities.length,
    };
  } catch (err) {
    console.error("Error fetching all modules activity:", err);
    return {
      data: [],
      error: String(err),
      count: 0,
    };
  }
};

/**
 * Compute aggregations for numeric columns
 */
const computeAggregations = (data: DataRow[], columns: string[]): Record<string, any> => {
  const aggregations: Record<string, any> = {};

  columns.forEach((col) => {
    const values = data
      .map((row) => parseFloat(row[col]))
      .filter((val) => !isNaN(val));

    if (values.length > 0) {
      aggregations[col] = {
        sum: values.reduce((acc, val) => acc + val, 0),
        avg: values.reduce((acc, val) => acc + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }
  });

  return aggregations;
};

/**
 * Export data for download
 * Converts module data to CSV format
 */
export const exportModuleData = (data: DataRow[], moduleKey: ModuleKey): string => {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]).filter(
    (key) => key !== "created_at" && key !== "updated_at"
  );
  
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Handle special characters in CSV
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      }).join(",")
    ),
  ];

  return csvRows.join("\n");
};

/**
 * Fetch metrics data for the BI dashboard
 * Calculates total revenue, active orders, inventory items, and total customers
 */
export const fetchMetricsData = async (): Promise<{
  totalRevenue: number;
  activeOrders: number;
  inventoryItems: number;
  totalCustomers: number;
  error: string | null;
}> => {
  try {
    // Fetch total revenue from sales_orders with completed delivery status
    const { data: orderData, count: completedOrderCount } = await supabase
      .from("sales_orders")
      .select("total_amount", { count: "exact" })
      .eq("delivery_status", "complete");

    const totalRevenue = orderData?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

    // Fetch all orders count (not just completed)
    const { count: allOrdersCount } = await supabase
      .from("sales_orders")
      .select("*", { count: "exact", head: true });

    // Fetch inventory items count
    const { count: inventoryCount } = await supabase
      .from("inventory")
      .select("*", { count: "exact", head: true });

    // Fetch customers count
    const { count: customerCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true });

    console.log("Metrics fetched:", {
      totalRevenue,
      activeOrders: allOrdersCount,
      completedOrders: completedOrderCount,
      inventoryItems: inventoryCount,
      totalCustomers: customerCount,
    });

    return {
      totalRevenue,
      activeOrders: allOrdersCount || 0,
      inventoryItems: inventoryCount || 0,
      totalCustomers: customerCount || 0,
      error: null,
    };
  } catch (err) {
    console.error("Error fetching metrics:", err);
    return {
      totalRevenue: 0,
      activeOrders: 0,
      inventoryItems: 0,
      totalCustomers: 0,
      error: String(err),
    };
  }
};

/**
 * Fetch stock transactions count for inventory module
 */
export const fetchStockTransactionsCount = async (): Promise<number> => {
  try {
    const { count } = await supabase
      .from("stock_transactions")
      .select("*", { count: "exact", head: true });

    console.log("Stock transactions count fetched:", count);
    return count || 0;
  } catch (err) {
    console.error("Error fetching stock transactions count:", err);
    return 0;
  }
};

/**
 * Fetch customer service metrics from customer_issues table
 */
export const fetchCustomerServiceMetrics = async (): Promise<{
  totalIssues: number;
  pendingIssues: number;
  resolvedIssues: number;
  error: string | null;
}> => {
  try {
    // Fetch total issues count
    const { count: totalCount } = await supabase
      .from("customer_issues")
      .select("*", { count: "exact", head: true });

    // Fetch pending issues count
    const { count: pendingCount } = await supabase
      .from("customer_issues")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Fetch resolved issues count
    const { count: resolvedCount } = await supabase
      .from("customer_issues")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved");

    console.log("Customer service metrics fetched:", {
      totalIssues: totalCount,
      pendingIssues: pendingCount,
      resolvedIssues: resolvedCount,
    });

    return {
      totalIssues: totalCount || 0,
      pendingIssues: pendingCount || 0,
      resolvedIssues: resolvedCount || 0,
      error: null,
    };
  } catch (err) {
    console.error("Error fetching customer service metrics:", err);
    return {
      totalIssues: 0,
      pendingIssues: 0,
      resolvedIssues: 0,
      error: String(err),
    };
  }
};
