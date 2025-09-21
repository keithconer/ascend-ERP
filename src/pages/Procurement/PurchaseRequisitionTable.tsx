import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react"; // Import the icons
import { AddRequisitionDialog } from "./AddRequisitionDialog";

export function PurchaseRequisitionTable() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [requisitionToEdit, setRequisitionToEdit] = useState(null);

  const { data: requisitions } = useQuery({
    queryKey: ["purchase-requisitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_requisitions")
        .select("id, requested_by, title, status, created_at, required_date")
        .order("id", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium";
      case "APPROVED":
        return "bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium";
      case "IN-PROGRESS":
        return "bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium";
      case "REJECTED":
        return "bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium";
      default:
        return "bg-gray-400 text-white px-3 py-1 rounded-full text-sm font-medium";
    }
  };

  const handleEdit = (requisition: any) => {
    setRequisitionToEdit(requisition);
    setShowAddDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this requisition?")) {
      const { error } = await supabase
        .from("purchase_requisitions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting requisition:", error.message);
        alert("Error: " + error.message);
      } else {
        queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      }
    }
  };

  const handleDialogClose = () => {
    setShowAddDialog(false);
    setRequisitionToEdit(null); // Reset the state
  };

  const handleRequisitionAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
    handleDialogClose(); // Close and reset
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Requester</th>
              <th className="px-4 py-2 border">Item</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Required Date</th>
              <th className="px-4 py-2 border">Created At</th>
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requisitions?.map((req) => (
              <tr key={req.id}>
                <td className="px-4 py-2 border">{req.id}</td>
                <td className="px-4 py-2 border">{req.requested_by}</td>
                <td className="px-4 py-2 border">{req.title}</td>
                <td className="px-4 py-2 border">
                  <span className={getStatusClasses(req.status)}>
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-2 border">
                  {new Date(req.required_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 border">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(req)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(req.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddRequisitionDialog
        open={showAddDialog}
        onOpenChange={handleDialogClose}
        onRequisitionAdded={handleRequisitionAdded}
        requisitionToEdit={requisitionToEdit}
      />
    </>
  );
}