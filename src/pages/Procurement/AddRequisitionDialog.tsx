import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Assuming you have this component or a similar one

interface Requisition {
  id: number;
  requested_by: string;
  title: string;
  required_date: string;
  status: string;
}

interface AddRequisitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequisitionAdded: () => void;
  requisitionToEdit?: Requisition | null;
}

export function AddRequisitionDialog({
  open,
  onOpenChange,
  onRequisitionAdded,
  requisitionToEdit,
}: AddRequisitionDialogProps) {
  const [requester, setRequester] = useState("");
  const [item, setItem] = useState("");
  const [requiredDate, setRequiredDate] = useState("");
  const [status, setStatus] = useState("PENDING");

  useEffect(() => {
    if (requisitionToEdit) {
      setRequester(requisitionToEdit.requested_by);
      setItem(requisitionToEdit.title);
      setRequiredDate(requisitionToEdit.required_date);
      setStatus(requisitionToEdit.status);
    } else {
      setRequester("");
      setItem("");
      setRequiredDate("");
      setStatus("PENDING");
    }
  }, [requisitionToEdit]);

  const handleSubmit = async () => {
    if (requisitionToEdit) {
      const { error } = await supabase
        .from("purchase_requisitions")
        .update({
          title: item,
          requested_by: requester,
          required_date: requiredDate,
        })
        .eq("id", requisitionToEdit.id);

      if (error) {
        console.error("Error updating requisition:", error.message);
        alert("Error: " + error.message);
      } else {
        onOpenChange(false);
        onRequisitionAdded();
      }
    } else {
      const { error } = await supabase.from("purchase_requisitions").insert([
        {
          title: item,
          description: `Requested by ${requester}`,
          requested_by: requester,
          status,
          required_date: requiredDate,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("Error adding requisition:", error.message);
        alert("Error: " + error.message);
      } else {
        onOpenChange(false);
        onRequisitionAdded();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {requisitionToEdit ? "Edit Purchase Requisition" : "New Purchase Requisition"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Label className="w-32 text-right">Requester Name:</Label>
            <Input
              placeholder="Requester Name"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <Label className="w-32 text-right">Item Name:</Label>
            <Input
              placeholder="Item Name"
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <Label className="w-32 text-right">Required Date:</Label>
            <Input
              type="date"
              placeholder="Required Date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            {requisitionToEdit ? "Save Changes" : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}