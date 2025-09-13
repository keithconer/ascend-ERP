import { useState } from "react";
import { ERPLayout } from "@/components/erp/ERPLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

// Placeholder subcomponents (replace with real ones later)
// import { PurchaseRequisition } from "@/components/procurement/PurchaseRequisition";
// import { SupplierManagement } from "@/components/procurement/SupplierManagement";
// import { PurchaseOrders } from "@/components/procurement/PurchaseOrders";
// import { GoodsReceipts } from "@/components/procurement/GoodsReceipts";
// import { AddRequisitionDialog } from "@/components/procurement/AddRequisitionDialog";

const ProcurementManagement: React.FC = () => {
  const [showAddRequisition, setShowAddRequisition] = useState < boolean > (false);

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Procurement & Purchasing</h1>
            <p className="text-muted-foreground">
              Manage purchase requisitions, suppliers, orders, and goods receipts
            </p>
          </div>
          <Button onClick={() => setShowAddRequisition(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Requisition
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">12</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Approved Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">34</div>
              <p className="text-xs text-muted-foreground">Ready for processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">Monitored & rated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">7</div>
              <p className="text-xs text-muted-foreground">Awaiting validation</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Procurement Functions */}
        <Tabs defaultValue="requisitions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="receipts">Goods & Invoices</TabsTrigger>
          </TabsList>

          <TabsContent value="requisitions">
            <PurchaseRequisition />
          </TabsContent>

          <TabsContent value="suppliers">
            <SupplierManagement />
          </TabsContent>

          <TabsContent value="orders">
            <PurchaseOrders />
          </TabsContent>

          <TabsContent value="receipts">
            <GoodsReceipts />
          </TabsContent>
        </Tabs>

        {/* Dialog for Adding Requisition */}
        <AddRequisitionDialog
          open={showAddRequisition}
          onOpenChange={(open: boolean) => setShowAddRequisition(open)}
        />
      </div>
    </ERPLayout>
  );
};

export default ProcurementManagement;
