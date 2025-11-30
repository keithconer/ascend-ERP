import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Download, Calendar, TrendingUp, Package, Users, PhilippinePeso, ShoppingCart } from "lucide-react";
import { MetricCard } from "@/components/reports&business_intelligence/metric_cards";
import { RevenueChart } from "@/components/reports&business_intelligence/revenuechart";
import { ModuleDataTable } from "@/components/reports&business_intelligence/moduledatatable";
import { QuickReports } from "@/components/reports&business_intelligence/quickreports";
import { useState, useEffect } from "react";
import { fetchMetricsData, fetchStockTransactionsCount, fetchCustomerServiceMetrics } from "@/components/reports&business_intelligence/services/dataAggregator";

const Dashboard = () => {
  const [showAllData, setShowAllData] = useState(false);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    inventoryItems: 0,
    totalCustomers: 0,
  });
  const [stockTransactionsCount, setStockTransactionsCount] = useState(0);
  const [customerServiceMetrics, setCustomerServiceMetrics] = useState({
    totalIssues: 0,
    pendingIssues: 0,
    resolvedIssues: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      const [metricsData, stockCount, csMetrics] = await Promise.all([
        fetchMetricsData(),
        fetchStockTransactionsCount(),
        fetchCustomerServiceMetrics(),
      ]);

      if (!metricsData.error) {
        setMetrics({
          totalRevenue: metricsData.totalRevenue,
          activeOrders: metricsData.activeOrders,
          inventoryItems: metricsData.inventoryItems,
          totalCustomers: metricsData.totalCustomers,
        });
      }
      setStockTransactionsCount(stockCount);
      if (!csMetrics.error) {
        setCustomerServiceMetrics({
          totalIssues: csMetrics.totalIssues,
          pendingIssues: csMetrics.pendingIssues,
          resolvedIssues: csMetrics.resolvedIssues,
        });
      }
      setLoading(false);
    };

    loadMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Business Intelligence</h1>
              <p className="text-muted-foreground mt-1">Module 7 - Comprehensive Reporting System</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Schedule Report
              </Button>
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Revenue"
            value={loading ? "Loading..." : `₱${metrics.totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            change=""
            trend="up"
            icon={PhilippinePeso}
            color="warning"
          />
          <MetricCard
            title="Active Orders"
            value={loading ? "Loading..." : metrics.activeOrders.toString()}
            change=""
            trend="up"
            icon={ShoppingCart}
            color="warning"
          />
          <MetricCard
            title="Inventory Items"
            value={loading ? "Loading..." : metrics.inventoryItems.toString()}
            change=""
            trend="up"
            icon={Package}
            color="warning"
          />
          <MetricCard
            title="Total Customers"
            value={loading ? "Loading..." : metrics.totalCustomers.toString()}
            change=""
            trend="up"
            icon={Users}
            color="warning"
          />
        </div>

        {/* Charts and Data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Revenue Trends</h2>
                <p className="text-sm text-muted-foreground">Monthly revenue across all modules</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
            <RevenueChart />
          </Card>

          <QuickReports />
        </div>

        {/* Module Data Tables */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-slate-100 grid w-full grid-cols-10 gap-1 p-2 rounded-lg h-auto">
            <TabsTrigger value="all" className="px-3 py-2 text-sm">All Modules</TabsTrigger>
            <TabsTrigger value="inventory" className="px-3 py-2 text-sm">Inventory</TabsTrigger>
            <TabsTrigger value="customer_service" className="px-3 py-2 text-sm">Customer Service</TabsTrigger>
            <TabsTrigger value="procurement" className="px-3 py-2 text-sm">Procurement</TabsTrigger>
            <TabsTrigger value="supply_chain" className="px-3 py-2 text-sm">Supply Chain</TabsTrigger>
            <TabsTrigger value="finance" className="px-3 py-2 text-sm">Finance</TabsTrigger>
            <TabsTrigger value="ecommerce" className="px-3 py-2 text-sm">E-Commerce</TabsTrigger>
            <TabsTrigger value="sales" className="px-3 py-2 text-sm">Sales</TabsTrigger>
            <TabsTrigger value="project_management" className="px-3 py-2 text-sm">Projects</TabsTrigger>
            <TabsTrigger value="hr" className="px-3 py-2 text-sm">Human Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ModuleDataTable module="all" limit={showAllData ? 1000 : 10} />
            <div className="flex justify-center pt-6">
              {!showAllData && (
                <Button onClick={() => setShowAllData(true)} size="sm" className="px-6 py-2">
                  See More Data
                </Button>
              )}
              {showAllData && (
                <Button onClick={() => setShowAllData(false)} size="sm" className="px-6 py-2">
                  Show Less
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-8">
            <div className="mb-6">
              <MetricCard
                title="Total Stock Transactions"
                value={loading ? "Loading..." : stockTransactionsCount.toString()}
                change=""
                trend="up"
                icon={Package}
                color="warning"
              />
            </div>
            <div>
              
              <ModuleDataTable module="inventory" />
            </div>
          </TabsContent>

          <TabsContent value="customer_service" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Issues"
                value={loading ? "Loading..." : customerServiceMetrics.totalIssues.toString()}
                change=""
                trend="up"
                icon={ShoppingCart}
                color="warning"
              />
              <MetricCard
                title="Pending Issues"
                value={loading ? "Loading..." : customerServiceMetrics.pendingIssues.toString()}
                change=""
                trend="up"
                icon={ShoppingCart}
                color="warning"
              />
              <MetricCard
                title="Resolved Issues"
                value={loading ? "Loading..." : customerServiceMetrics.resolvedIssues.toString()}
                change=""
                trend="up"
                icon={ShoppingCart}
                color="warning"
              />
            </div>
            <ModuleDataTable module="customer_service" />
          </TabsContent>

          <TabsContent value="procurement" className="space-y-8">
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Purchase Order Items</h3>
              <ModuleDataTable module="procurement" subtable="purchase_order_items" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Goods Receipts</h3>
              <ModuleDataTable module="procurement" subtable="goods_receipts" />
            </div>
          </TabsContent>

          <TabsContent value="supply_chain" className="space-y-4">
            <ModuleDataTable module="supply_chain" />
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <ModuleDataTable module="finance" />
          </TabsContent>

          <TabsContent value="ecommerce" className="space-y-4">
            <ModuleDataTable module="ecommerce" />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <ModuleDataTable module="sales" />
          </TabsContent>

          <TabsContent value="project_management" className="space-y-4">
            <ModuleDataTable module="project_management" />
          </TabsContent>

          <TabsContent value="hr" className="space-y-4">
            <ModuleDataTable module="hr" />
          </TabsContent>
        </Tabs>

        
      </main>
    </div>
  );
};

export default Dashboard;
