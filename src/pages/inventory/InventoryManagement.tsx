import { useState } from "react";
import { ERPLayout } from "@/components/erp/ERPLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { ItemsTable } from "@/components/inventory/ItemsTable";
import { AddItemDialog } from "@/components/inventory/AddItemDialog";

export default function InventoryManagement() {
  const [showAddItem, setShowAddItem] = useState(false);

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Inventory Management
            </h1>
            <p className="text-muted-foreground">
              Manage your items — add, view, and delete records.
            </p>
          </div>
          <Button onClick={() => setShowAddItem(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Only Items tab (with delete functionality inside ItemsTable) */}
        <Tabs defaultValue="items" className="space-y-4">
          <TabsList>
            <TabsTrigger value="items">Items</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <ItemsTable />
          </TabsContent>
        </Tabs>

        <AddItemDialog open={showAddItem} onOpenChange={setShowAddItem} />
      </div>
    </ERPLayout>
  );
}
