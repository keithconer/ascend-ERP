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

export const SupplierManagementTable = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [addSupplierDialogOpen, setAddSupplierDialogOpen] = useState(false);
  const [deleteSupplierDialogOpen, setDeleteSupplierDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const [newSupplierName, setNewSupplierName] = useState("");
  const [newSupplierContactInfo, setNewSupplierContactInfo] = useState("");
  const [newSupplierIsActive, setNewSupplierIsActive] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch suppliers:", error.message);
    } else {
      setSuppliers(data || []);
    }
  };

  const handleAddSupplier = async () => {
    if (!newSupplierName.trim() || !newSupplierContactInfo.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    setAddSupplierDialogOpen(false);

    const { data, error } = await supabase
      .from("suppliers")
      .insert([
        {
          name: newSupplierName,
          contact_info: newSupplierContactInfo,
          is_active: newSupplierIsActive,
        },
      ])
      .select(); // IMPORTANT: Select to return inserted row

    if (error) {
      console.error("Error adding supplier:", error.message);
    } else if (data && data.length > 0) {
      setSuppliers((prev) => [data[0], ...prev]);
      setNewSupplierName("");
      setNewSupplierContactInfo("");
      setNewSupplierIsActive(true);
    }
  };

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
      await fetchSuppliers();
    }

    setDeleteSupplierDialogOpen(false);
    setSupplierToDelete(null);
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Supplier Management</h2>
        <Button onClick={() => setAddSupplierDialogOpen(true)}>Add Supplier</Button>
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
                    <Button variant="ghost" size="icon">
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
            <Button
              variant="outline"
              className="w-full mr-2"
              onClick={() => setAddSupplierDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="default" className="w-full" onClick={handleAddSupplier}>
              Add Supplier
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
