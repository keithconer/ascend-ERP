import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contact_info: string;
  is_active: boolean;
}

interface SupplierManagementTableProps {
  activeSuppliers: Supplier[];
  onSuppliersChanged: () => void;
  setShowAddSupplier: (show: boolean) => void;
  onAddSupplier: (newSupplier: Supplier) => void;
}

export const SupplierManagementTable = ({
  activeSuppliers,
  onSuppliersChanged,
  setShowAddSupplier,
  onAddSupplier,
}: SupplierManagementTableProps) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(activeSuppliers || []);
  const [deleteSupplierDialogOpen, setDeleteSupplierDialogOpen] = useState(false);
  const [editSupplierDialogOpen, setEditSupplierDialogOpen] = useState(false);

  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  // Edit supplier form state
  const [editSupplierName, setEditSupplierName] = useState("");
  const [editSupplierContactInfo, setEditSupplierContactInfo] = useState("");
  const [editSupplierIsActive, setEditSupplierIsActive] = useState(true);

  // Keep suppliers state in sync with activeSuppliers prop
  useEffect(() => {
    setSuppliers(activeSuppliers);
  }, [activeSuppliers]);

  // Delete Supplier
  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setDeleteSupplierDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", supplierToDelete.id);

    if (error) {
      console.error("Error deleting supplier:", error.message);
    } else {
      onSuppliersChanged(); // Notify parent to refresh queries
    }

    setDeleteSupplierDialogOpen(false);
    setSupplierToDelete(null);
  };

  // Edit Supplier
  const handleEditClick = (supplier: Supplier) => {
    setSupplierToEdit(supplier);
    setEditSupplierName(supplier.name);
    setEditSupplierContactInfo(supplier.contact_info);
    setEditSupplierIsActive(supplier.is_active);
    setEditSupplierDialogOpen(true);
  };

  const handleUpdateSupplier = async () => {
    if (!supplierToEdit) return;

    if (!editSupplierName.trim() || !editSupplierContactInfo.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    const { error } = await supabase
      .from("suppliers")
      .update({
        name: editSupplierName,
        contact_info: editSupplierContactInfo,
        is_active: editSupplierIsActive,
      })
      .eq("id", supplierToEdit.id);

    if (error) {
      console.error("Error updating supplier:", error.message);
    } else {
      onSuppliersChanged(); // Notify parent to refresh queries
      setEditSupplierDialogOpen(false);
      setSupplierToEdit(null);
    }
  };

  // Add Supplier Dialog state
  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierContactInfo, setNewSupplierContactInfo] = useState("");
  const [newSupplierIsActive, setNewSupplierIsActive] = useState(true);
  const [addSupplierDialogOpen, setAddSupplierDialogOpen] = useState(false);

  // Open add dialog and sync with parent
  const openAddSupplierDialog = () => {
    setAddSupplierDialogOpen(true);
    setShowAddSupplier(true); // inform parent in case needed
  };

  const closeAddSupplierDialog = () => {
    setAddSupplierDialogOpen(false);
    setShowAddSupplier(false);
    setNewSupplierName("");
    setNewSupplierContactInfo("");
    setNewSupplierIsActive(true);
  };

  // Add Supplier handler
  const handleAddSupplier = async () => {
    if (!newSupplierName.trim() || !newSupplierContactInfo.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    const { data, error } = await supabase
      .from("suppliers")
      .insert([
        {
          name: newSupplierName,
          contact_info: newSupplierContactInfo,
          is_active: newSupplierIsActive,
        },
      ])
      .select();

    if (error) {
      console.error("Error adding supplier:", error.message);
    } else if (data && data.length > 0) {
      onAddSupplier(data[0]); // Pass new supplier to parent
      closeAddSupplierDialog();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Supplier Management</h2>
        <Button onClick={openAddSupplierDialog}>Add Supplier</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>{supplier.id}</TableCell>
                <TableCell>{supplier.name}</TableCell>
                <TableCell>{supplier.contact_info}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-semibold ${
                      supplier.is_active ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                    }`}
                  >
                    {supplier.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(supplier)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(supplier)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Supplier Dialog */}
      <Dialog open={addSupplierDialogOpen} onOpenChange={setAddSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Supplier</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-4">
              <label className="w-32 text-right font-medium">Name:</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md"
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-right font-medium">Contact Info:</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md"
                value={newSupplierContactInfo}
                onChange={(e) => setNewSupplierContactInfo(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-right font-medium">Status:</label>
              <select
                className="w-full border px-3 py-2 rounded-md"
                value={newSupplierIsActive ? "active" : "inactive"}
                onChange={(e) => setNewSupplierIsActive(e.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-between">
            <Button variant="outline" className="w-full mr-2" onClick={closeAddSupplierDialog}>
              Cancel
            </Button>
            <Button variant="default" className="w-full" onClick={handleAddSupplier}>
              Add Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={editSupplierDialogOpen} onOpenChange={setEditSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-4">
              <label className="w-32 text-right font-medium">Name:</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md"
                value={editSupplierName}
                onChange={(e) => setEditSupplierName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-right font-medium">Contact Info:</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded-md"
                value={editSupplierContactInfo}
                onChange={(e) => setEditSupplierContactInfo(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="w-32 text-right font-medium">Status:</label>
              <select
                className="w-full border px-3 py-2 rounded-md"
                value={editSupplierIsActive ? "active" : "inactive"}
                onChange={(e) => setEditSupplierIsActive(e.target.value === "active")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-between">
            <Button
              variant="outline"
              className="w-full mr-2"
              onClick={() => {
                setEditSupplierDialogOpen(false);
                setSupplierToEdit(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="default" className="w-full" onClick={handleUpdateSupplier}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteSupplierDialogOpen} onOpenChange={setDeleteSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete supplier "{supplierToDelete?.name}"?
          </p>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteSupplierDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
