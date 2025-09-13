import { ERPLayout } from "@/components/erp/ERPLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PurchaseRequisition from "@/pages/procurement/PurchaseRequisition";

interface Requisition {
  id: number;
  itemName: string;
  quantity: number;
  description: string;
  neededBy: string;
  status: "pending" | "approved" | "rejected";
}

const ProcurementManagement: React.FC = () => {
  // Callback: (kept in case you want to use later for approvals/rejections)
  const handleRequisitionAdded = (req: Requisition) => {
    console.log("New requisition added:", req);
  };

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Procurement (Purchasing)</h1>
            <p className="text-muted-foreground">
              For tracking the raw material purchasing everyday.
            </p>
          </div>
        </div>

        {/* Tabs for Procurement Functions */}
        <Tabs defaultValue="requisitions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          </TabsList>

          <TabsContent value="requisitions">
            <PurchaseRequisition onRequisitionAdded={handleRequisitionAdded} />
          </TabsContent>
        </Tabs>
      </div>
    </ERPLayout>
  );
};

export default ProcurementManagement;
