import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, Download, Calendar, TrendingUp, Package, Users, DollarSign, ShoppingCart } from "lucide-react";
import { MetricCard } from "@/components/reports&business_intelligence/metric_cards";
import { RevenueChart } from "@/components/reports&business_intelligence/revenuechart";
import { ModuleDataTable } from "@/components/reports&business_intelligence/moduledatatable";
import { QuickReports } from "@/components/reports&business_intelligence/quickreports";

const Dashboard = () => {
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
            value="₱2,458,420"
            change="+12.5%"
            trend="up"
            icon={DollarSign}
            color="warning"
          />
          <MetricCard
            title="Active Orders"
            value="1,234"
            change="+8.2%"
            trend="up"
            icon={ShoppingCart}
            color="warning"
          />
          <MetricCard
            title="Inventory Items"
            value="8,456"
            change="-2.4%"
            trend="down"
            icon={Package}
            color="warning"
          />
          <MetricCard
            title="Total Customers"
            value="15,892"
            change="+15.3%"
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
          <TabsList className="bg-muted">
            <TabsTrigger value="all">All Modules</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ModuleDataTable module="all" />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <ModuleDataTable module="inventory" />
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <ModuleDataTable module="sales" />
          </TabsContent>

          <TabsContent value="finance" className="space-y-4">
            <ModuleDataTable module="finance" />
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
