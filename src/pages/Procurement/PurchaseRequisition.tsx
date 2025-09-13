import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PurchaseRequisition: React.FC = () => {
  const [items, setItems] = useState<{ id: number; name: string; quantity: number }[]>([]);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);

  const handleAdd = () => {
    if (!itemName.trim()) return;
    setItems([...items, { id: items.length + 1, name: itemName, quantity }]);
    setItemName("");
    setQuantity(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Requisition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Item Form */}
        <div className="flex gap-2">
          <Input
            placeholder="Item name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          <Button onClick={handleAdd}>Add</Button>
        </div>

        {/* Table of Items */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No requisitions added
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default PurchaseRequisition;
