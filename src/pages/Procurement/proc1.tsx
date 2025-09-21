import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ERPLayout } from "@/components/erp/ERPLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

import { PurchaseRequisitionTable } from "./PurchaseRequisitionTable";
import { SupplierManagement } from "./SupplierManagement";
import { PurchaseOrderManagement } from "./PurchaseOrderManagement";
import { GoodsReceiptMatching } from "./GoodsReceiptMatching";
import { AddRequisitionDialog } from "./AddRequisitionDialog";

export default function ProcurementManagement() {
  const [showAddRequisition, setShowAddRequisition] = useState(false);
  const queryClient = useQueryClient();

  const { data: procurementStats } = useQuery({
    queryKey: ["procurement-stats"],
    queryFn: async () => {
      const [pendingReq, activeSuppliers, openPOs, pendingReceipts] =
        await Promise.all([
          supabase
            .from("purchase_requisitions")
            .select("*", { count: "exact", head: true })
            .eq("status", "PENDING"), // Corrected status field
          supabase
            .from("suppliers")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("purchase_orders")
            .select("*", { count: "exact", head: true })
            .in("status", ["sent", "confirmed", "delivered"]),
          supabase
            .from("goods_receipts")
            .select("*", { count: "exact", head: true })
            .eq("is_verified", false), // Corrected is_verified field
        ]);

      return {
        pendingRequisitions: pendingReq.count || 0,
        activeSuppliers: activeSuppliers.count || 0,
        openPOs: openPOs.count || 0,
        pendingReceipts: pendingReceipts.count || 0,
      };
    },
  });

  // 🔄 Callback to refresh the requisition table
  const handleRequisitionAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
    queryClient.invalidateQueries({ queryKey: ["procurement-stats"] });
  };

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Procurement (Purchasing)</h1>
            <p className="text-muted-foreground">
              Manage requisitions, suppliers, purchase orders, and goods receipt
            </p>
          </div>
          {!showAddRequisition && (
            <Button onClick={() => setShowAddRequisition(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Requisition
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requisitions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {procurementStats?.pendingRequisitions || 0}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {procurementStats?.activeSuppliers || 0}
              </div>
              <p className="text-xs text-muted-foreground">Registered vendors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {procurementStats?.openPOs || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently in process
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Goods Receipts Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {procurementStats?.pendingReceipts || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Awaiting verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="requisitions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
            <TabsTrigger value="goods-receipt">Goods Receipt</TabsTrigger>
          </TabsList>

          <TabsContent value="requisitions">
            <PurchaseRequisitionTable />
          </TabsContent>
          <TabsContent value="suppliers">
            <SupplierManagement />
          </TabsContent>
          <TabsContent value="purchase-orders">
            <PurchaseOrderManagement />
          </TabsContent>
          <TabsContent value="goods-receipt">
            <GoodsReceiptMatching />
          </TabsContent>
        </Tabs>

        {/* Add Requisition Dialog */}
        <AddRequisitionDialog
          open={showAddRequisition}
          onOpenChange={setShowAddRequisition}
          onRequisitionAdded={handleRequisitionAdded} // 🔑 Pass callback
        />
      </div>
    </ERPLayout>
  );
}