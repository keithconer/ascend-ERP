// Enhanced Module Data Table Component
// Dynamically displays data from any ERP module with support for aggregations and exports

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { ModuleKey, DataRow } from "@/components/reports&business_intelligence/types/bi";
import { fetchModuleData, exportModuleData } from "@/components/reports&business_intelligence/services/dataAggregator";
import { MODULE_INFO } from "@/components/reports&business_intelligence/services/moduleMapping";
import { toast } from "sonner";

interface ModuleDataTableProps {
  module: ModuleKey;
  limit?: number;
  showExport?: boolean;
  showRefresh?: boolean;
  onRowClick?: (row: DataRow) => void;
}

export const ModuleDataTable = ({
  module,
  limit = 10,
  showExport = true,
  showRefresh = true,
  onRowClick,
}: ModuleDataTableProps) => {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregations, setAggregations] = useState<Record<string, any>>({});
  const [recordCount, setRecordCount] = useState(0);

  const moduleInfo = MODULE_INFO[module];

  const loadData = async () => {
    setLoading(true);
    const result = await fetchModuleData(module, { limit });

    if (result.error) {
      toast.error(`Failed to load ${moduleInfo.name} data`, {
        description: result.error,
      });
      setData([]);
    } else {
      setData(result.data);
      setRecordCount(result.count);
      setAggregations(result.aggregations || {});
      
      if (result.data.length === 0) {
        toast.info(`No data found in ${moduleInfo.name}`, {
          description: "This module appears to be empty.",
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [module, limit]);

  const handleExport = () => {
    try {
      const csv = exportModuleData(data, module);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${module}_export_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully", {
        description: `Downloaded ${data.length} records as CSV`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: String(error),
      });
    }
  };

  const handleRefresh = () => {
    toast.info("Refreshing data...");
    loadData();
  };

  const getStatusVariant = (status: string) => {
    const lowerStatus = String(status).toLowerCase();
    if (["completed", "active", "paid", "delivered", "approved"].includes(lowerStatus)) {
      return "default";
    }
    if (["pending", "in progress", "processing"].includes(lowerStatus)) {
      return "secondary";
    }
    return "outline";
  };

  const formatCellValue = (key: string, value: any): string | JSX.Element => {
    if (value === null || value === undefined) return "-";
    
    // Handle nested objects from joins (e.g., {"name":"Mouse ROG"})
    if (typeof value === "object" && !Array.isArray(value)) {
        if (value.name) return value.name;
        if (value.customer_name) return value.customer_name;   // <-- add this
        if (value.id) return String(value.id);
        return JSON.stringify(value);
        }

    
    // Format dates
    if (key.includes("date") && typeof value === "string") {
      return new Date(value).toLocaleDateString();
    }
    
    // Format currency
    if (["amount", "value", "salary", "budget", "total_amount"].includes(key)) {
      return typeof value === "number" ? `$${value.toLocaleString()}` : value;
    }
    
    // Format status as badge
    if (key === "status") {
      return <Badge variant={getStatusVariant(value)}>{value}</Badge>;
    }
    
    return typeof value === "object" ? JSON.stringify(value) : String(value);
  };

  const displayColumns = data.length > 0 
    ? moduleInfo.columns?.display || Object.keys(data[0]).filter(
        key => !["created_at", "id", "_internalId"].includes(key)
      )
    : [];

  // Reorder data to match display column order
  const reorderedData = data.map((row: any) => {
    const reordered: Record<string, any> = {};
    displayColumns.forEach((col) => {
      reordered[col] = row[col];
    });
    return reordered;
  });

  return (
    <Card className="shadow-sm border-border">
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {moduleInfo.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? "Loading..." : `${recordCount} total records`}
            </p>
          </div>
          <div className="flex gap-2">
            {showRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            )}
            {showExport && data.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>

        {/* Display aggregations if available */}
        {Object.keys(aggregations).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {Object.entries(aggregations).map(([col, stats]: [string, any]) => (
              <div key={col} className="bg-muted/50 px-3 py-2 rounded-md">
                <span className="font-medium text-muted-foreground">
                  {col.replace(/_/g, " ").toUpperCase()}:
                </span>
                <span className="ml-2 text-foreground font-semibold">
                  {stats.sum ? new Intl.NumberFormat().format(stats.sum) : stats.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading {moduleInfo.name} data...</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground font-medium">No data available</p>
              <p className="text-sm text-muted-foreground mt-1">
                This module doesn't have any records yet
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {displayColumns.map((key) => (
                  <TableHead key={key} className="font-semibold">
                    {key
                      .replace(/[_()]/g, " ")
                      .toLowerCase()
                      .split(" ")
                      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                      .join(" ")}
                  </TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reorderedData.map((row: any, idx: number) => (
                <TableRow key={row._internalId ?? idx} onClick={() => onRowClick?.(row)}>
                  {displayColumns.map((key) => (
                    <TableCell key={key}>
                      {formatCellValue(key, row[key])}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
};
