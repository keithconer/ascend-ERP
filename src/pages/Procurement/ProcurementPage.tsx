import { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import PurchaseRequisitionTable from "./PurchaseRequisitionTable";
import PurchaseRequisitionForm from "./PurchaseRequisitionForm";
import PurchaseOrderTable from "./PurchaseOrderTable";
import SupplierManagement from "./SupplierManagement";
import GoodsReceiptTable from "./GoodsReceiptTable"; // New import
import { Button } from "@/components/ui/button";

export default function ProcurementPage() {
  const [tab, setTab] = useState("requisitions");
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Procurement</h1>

      <Button onClick={() => setShowForm((prev) => !prev)} className="mb-4">
        {showForm ? "Hide Form" : "New Purchase Requisition"}
      </Button>

      {showForm && <PurchaseRequisitionForm onSuccess={handleFormSuccess} />}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="suppliers">Supplier Management</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="goods-receipts">Goods Receipts</TabsTrigger> {/* New tab */}
        </TabsList>

        <TabsContent value="suppliers" className="mt-4">
          <SupplierManagement />
        </TabsContent>

        <TabsContent value="requisitions" className="mt-4">
          <PurchaseRequisitionTable key={refreshKey} />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <PurchaseOrderTable />
        </TabsContent>

        <TabsContent value="goods-receipts" className="mt-4">
          <GoodsReceiptTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
