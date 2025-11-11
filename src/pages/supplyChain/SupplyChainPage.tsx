import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ERPLayout } from '@/components/erp/ERPLayout';

// Import Supply Chain Components
import DemandForecasting from '@/components/supplyChain/DemandForecasting';
import RoutingManagement from '@/components/supplyChain/RoutingManagement';
import SupplyChainPlanning from '@/components/supplyChain/SupplyChainPlanning';

export default function SupplyChainPage() {
  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supply Chain Management</h1>
          <p className="text-muted-foreground">
            Manage supply chain planning, routing, and demand forecasting processes.
          </p>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="supply-chain-planning" className="space-y-4">
          <TabsList>
            <TabsTrigger value="supply-chain-planning">Supply Chain Planning</TabsTrigger>
            <TabsTrigger value="routing-management">Routing Management</TabsTrigger>
            <TabsTrigger value="demand-forecasting">Demand Forecasting</TabsTrigger>
          </TabsList>

          <TabsContent value="supply-chain-planning">
            <SupplyChainPlanning />
          </TabsContent>

          <TabsContent value="routing-management">
            <RoutingManagement />
          </TabsContent>

          <TabsContent value="demand-forecasting">
            <DemandForecasting />
          </TabsContent>
        </Tabs>
      </div>
    </ERPLayout>
  );
}
