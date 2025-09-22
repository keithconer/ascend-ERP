import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// MOCK inventory update function, replace with your real inventory logic
async function updateInventoryStock(receiptItems: Array<{ product_id: string; quantity: number }>) {
  for (const item of receiptItems) {
    // Example: Upsert inventory with increased quantity
    // await supabase.from("inventory").upsert({
    //   product_id: item.product_id,
    //   quantity: item.quantity,
    //   updated_at: new Date().toISOString(),
    // }, { onConflict: "product_id" });
  }
  console.log("Inventory updated for items:", receiptItems);
}

export function GoodsReceiptMatching() {
  const queryClient = useQueryClient();

  // Form state
  const [poId, setPoId] = useState("");
  const [receivedBy, setReceivedBy] = useState("");

  // Fetch all goods receipts
  const { data: receipts, isLoading } = useQuery({
    queryKey: ["goods-receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goods_receipts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Mutation to create goods receipt and update inventory
  const createGoodsReceipt = useMutation({
    mutationFn: async () => {
      const poIdNum = parseInt(poId, 10);

      if (!poIdNum || !receivedBy) {
        throw new Error("PO ID and Received By are required");
      }

      // Step 1: Fetch purchase order items for this PO
      const { data: poItems, error: poError } = await supabase
        .from("purchase_order_items")
        .select("product_id, quantity")
        .eq("purchase_order_id", poIdNum);

      if (poError) throw poError;
      if (!poItems || poItems.length === 0) {
        throw new Error("No items found for this Purchase Order");
      }

      // Step 2: Update inventory stock for the received items
      await updateInventoryStock(poItems);

      // Step 3: Insert goods receipt record (mark as verified)
      const { data, error } = await supabase
        .from("goods_receipts")
        .insert([
          {
            purchase_order_id: poIdNum,
            received_by: receivedBy,
            is_verified: true,
          },
        ])
        .select();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goods-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["procurement-stats"] }); // Refresh stats too
      setPoId("");
      setReceivedBy("");
      alert("Goods receipt created and inventory updated.");
    },
    onError: (err) => {
      console.error("Error creating receipt and updating inventory:", err);
      alert(`Failed to create goods receipt: ${err instanceof Error ? err.message : "Unknown error"}`);
    },
  });

  return (
    <Card>
      <CardContent className="space-y-6">
        {/* Form to Add Goods Receipt */}
        <div className="space-y-4 border-b pb-4">
          <h2 className="text-lg font-medium">Create Goods Receipt</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="po-id">Purchase Order ID</Label>
              <Input
                id="po-id"
                type="number"
                placeholder="Enter PO ID"
                value={poId}
                onChange={(e) => setPoId(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="received-by">Received By</Label>
              <Input
                id="received-by"
                type="text"
                placeholder="Enter your name"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => createGoodsReceipt.mutate()} disabled={!poId || !receivedBy}>
            Submit Goods Receipt
          </Button>
        </div>

        {/* Table of Existing Goods Receipts */}
        <div>
          <h2 className="text-lg font-medium mb-2">Goods Receipt Records</h2>
          {isLoading ? (
            <p>Loading goods receipts...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Received By</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts?.map((receipt: any) => (
                  <TableRow key={receipt.id}>
                    <TableCell>{receipt.id}</TableCell>
                    <TableCell>{receipt.purchase_order_id}</TableCell>
                    <TableCell>{receipt.received_by}</TableCell>
                    <TableCell>{receipt.is_verified ? "✅" : "❌"}</TableCell>
                    <TableCell>
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
