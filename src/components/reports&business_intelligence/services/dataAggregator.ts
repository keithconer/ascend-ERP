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
  } = {}
): Promise<FetchResult> => {
  const { limit = 10, orderBy = "id", ascending = false, filters = {} } = options;

  // Special handling for "all" modules view
  if (moduleKey === "all") {
    return fetchAllModulesActivity();
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
    // Build the base query
    let query: any = supabase
      .from<any, any>(config.primary)
      .select(config.columns.display.join(", "), { count: "exact" });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value);
      }
    });

    // Apply ordering and limit
    query = query.order(orderBy, { ascending }).limit(limit);

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
export const fetchAllModulesActivity = async (): Promise<FetchResult> => {
  const activeModules = getActiveModules();
  const activities: DataRow[] = [];

  try {
    // Fetch recent records from each module
    for (const moduleKey of activeModules) {
      const config = MODULE_TABLE_MAPPING[moduleKey];
      const moduleInfo = MODULE_INFO[moduleKey];

      const { data, count } = await supabase
        .from<any, any>(config.primary)
        .select("id", { count: "exact" })
        .order("id", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        data.forEach((record) => {
          activities.push({
            id: `${moduleKey}-${record.id}`,
            module: moduleInfo.name,
            type: `${config.primary} record`,
            status: "Completed",
            date: new Date().toISOString().split("T")[0],
            records: count || 0,
          });
        });
      }
    }

    // Sort by id descending (most recent IDs typically higher)
    activities.sort((a, b) => {
      const aId = parseInt(a.id.split('-')[1]) || 0;
      const bId = parseInt(b.id.split('-')[1]) || 0;
      return bId - aId;
    });

    return {
      data: activities.slice(0, 20), // Return top 20 most recent
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
 * Fetch aggregated data across multiple modules
 * Useful for cross-module reports and dashboards
 */
export const fetchAggregatedReport = async (
  config: ReportConfig
): Promise<AggregatedData[]> => {
  const results: AggregatedData[] = [];

  for (const moduleKey of config.modules) {
    const { data, count, aggregations } = await fetchModuleData(moduleKey, {
      limit: 100,
      filters: config.filters,
    });

    results.push({
      module: MODULE_INFO[moduleKey].name,
      count,
      lastUpdated: new Date().toISOString(),
      summary: aggregations || {},
      details: data,
    });
  }

  return results;
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
 * Fetch summary statistics for a module
 * Returns key metrics like total records, recent activity, etc.
 */
export const fetchModuleSummary = async (
  moduleKey: ModuleKey
): Promise<Record<string, any>> => {
  const config = MODULE_TABLE_MAPPING[moduleKey];
  if (!config) return {};

  try {
    const { count } = await supabase
      .from<any, any>(config.primary)
      .select("*", { count: "exact", head: true });

    const { data: recentData } = await supabase
      .from<any, any>(config.primary)
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    return {
      totalRecords: count || 0,
      lastActivity: recentData?.[0]?.id || null,
      tableName: config.primary,
    };
  } catch (err) {
    console.error(`Error fetching summary for ${moduleKey}:`, err);
    return {};
  }
};
