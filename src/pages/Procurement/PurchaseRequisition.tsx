
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Requisition {
  id: number;
  itemName: string;
  quantity: number;
  description: string;
  neededBy: string;
  status: "pending" | "approved" | "rejected";
}

interface Props {
  onRequisitionAdded: (req: Requisition) => void;
}

const PurchaseRequisition: React.FC<Props> = ({ onRequisitionAdded }) => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [open, setOpen] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(true);

  // form states
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [neededBy, setNeededBy] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !quantity || !neededBy) return;

    const newReq: Requisition = {
      id: requisitions.length + 1,
      itemName,
      quantity,
      description,
      neededBy,
      status: "pending",
    };

    const updated = [...requisitions, newReq];
    setRequisitions(updated);
    onRequisitionAdded(newReq);

    // reset + close dialog + hide button
    setItemName("");
    setQuantity(1);
    setDescription("");
    setNeededBy("");
    setOpen(false);
    
  };

  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Pending Requisitions{" "}
          <span className="ml-2 rounded bg-yellow-200 px-2 py-0.5 text-sm text-yellow-800">
            {requisitions.length}
          </span>
        </h3>

        {buttonVisible && (
          <Button onClick={() => setOpen(true)}>+ New Requisition</Button>
        )}
      </div>

      {/* Dialog (Pop-up Form) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Purchase Requisition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                placeholder="Enter item name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neededBy">Needed By</Label>
              <Input
                id="neededBy"
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Add Requisition
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Table of Pending Requisitions */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Requisitions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Needed By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No pending requisitions
                  </TableCell>
                </TableRow>
              ) : (
                requisitions.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>{req.id}</TableCell>
                    <TableCell>{req.itemName}</TableCell>
                    <TableCell>{req.quantity}</TableCell>
                    <TableCell>{req.description || "-"}</TableCell>
                    <TableCell>{req.neededBy}</TableCell>
                    <TableCell className="text-yellow-600 font-medium">Pending</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseRequisition;
