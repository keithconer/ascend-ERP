import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDept, setEditingDept] = useState<{ id: string; name: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");
  
  // State for delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);

  // Fetch departments when the component mounts
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from("departments").select("*");
      if (error) {
        console.error("Error fetching departments:", error);
      } else {
        setDepartments(data || []);
      }
    };
    fetchDepartments();
  }, []);

  // Handle department search by typing
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchTerm) {
        const { data, error } = await supabase.from("departments").select("*");
        if (error) {
          console.error("Error fetching departments:", error);
        } else {
          setDepartments(data || []);
        }
      } else {
        const { data, error } = await supabase
          .from("departments")
          .select("*")
          .ilike("name", `%${searchTerm}%`);

        if (error) {
          console.error("Error searching departments:", error);
        } else {
          setDepartments(data || []);
        }
      }
    };

    handleSearch();
  }, [searchTerm]);

  // Handle adding a new department
  const handleAddDepartment = async () => {
    const randomID = Math.floor(Math.random() * 100000); // Random ID generation
    const { error } = await supabase
      .from("departments")
      .insert([{ id: randomID.toString(), name: newDeptName }]);

    if (error) {
      console.error("Error adding department:", error);
    } else {
      setDepartments((prev) => [
        ...prev,
        { id: randomID.toString(), name: newDeptName },
      ]);
      setIsModalOpen(false);
      setNewDeptName(""); // Reset the form
    }
  };

  // Handle updating a department
  const handleUpdateDepartment = async () => {
    if (editingDept) {
      const { error } = await supabase
        .from("departments")
        .update({ name: editingDept.name })
        .eq("id", editingDept.id);

      if (error) {
        console.error("Error updating department:", error);
      } else {
        setDepartments((prev) =>
          prev.map((dept) =>
            dept.id === editingDept.id ? { ...dept, name: editingDept.name } : dept
          )
        );
        setEditingDept(null); // Close the modal
      }
    }
  };

  // Handle deleting a department
  const handleDeleteDepartment = async () => {
    if (deptToDelete) {
      const { error } = await supabase.from("departments").delete().eq("id", deptToDelete);

      if (error) {
        console.error("Error deleting department:", error);
      } else {
        setDepartments((prev) => prev.filter((dept) => dept.id !== deptToDelete)); // Remove from UI
      }
      setConfirmDelete(false); // Close the confirmation dialog
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-x-4">
        {/* Department Management Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">Department Management</h2>
        </div>

        {/* Search Bar and Add Department Button */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search Department"
              className="input input-bordered w-72 pl-10 pr-4 py-2 rounded-full border-gray-300 focus:ring-2 focus:ring-primary transition-all duration-300 ease-in-out"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          {/* Add Department Button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-3"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add New Department
          </Button>
        </div>
      </div>

      {/* Department Table */}
      <Card className="border-none p-0">
        <CardContent className="p-0">
          <div className="overflow-x-auto mt-4">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableCell className="py-1 px-2">Department ID</TableCell>
                  <TableCell className="py-1 px-2">Department Name</TableCell>
                  <TableCell className="py-1 px-2">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="py-1 px-2">{dept.id}</TableCell>
                    <TableCell className="py-1 px-2">{dept.name}</TableCell>
                    <TableCell className="py-1 px-2 flex space-x-2">
                      <Button
                        onClick={() => setEditingDept(dept)}
                        className="bg-secondary text-white hover:bg-secondary-dark text-xs py-1 px-2"
                      >
                        <Edit className="mr-1 h-4 w-4 text-primary" />
                      </Button>
                      <Button
                        onClick={() => {
                          setDeptToDelete(dept.id);
                          setConfirmDelete(true);
                        }}
                        className="bg-destructive text-white hover:bg-destructive-dark text-xs py-1 px-2"
                      >
                        <Trash className="mr-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Department Modal */}
      {editingDept && (
        <Dialog open={true} onOpenChange={() => setEditingDept(null)}>
          <DialogContent className="max-w-lg p-6 bg-white shadow-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="editDeptName" className="block text-sm font-semibold">
                  Department Name
                </label>
                <input
                  id="editDeptName"
                  type="text"
                  value={editingDept.name}
                  onChange={(e) => setEditingDept({ ...editingDept, name: e.target.value })}
                  className="input input-bordered w-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpdateDepartment}
                disabled={!editingDept.name}
                className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-4"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Department Modal */}
      {isModalOpen && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-lg p-6 bg-white shadow-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="deptName" className="block text-sm font-semibold">Department Name</label>
                <input
                  id="deptName"
                  type="text"
                  placeholder="Enter Department Name"
                  className="input input-bordered w-full"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddDepartment}
                disabled={!newDeptName}
                className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-4"
              >
                Save Department
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <Dialog open={confirmDelete} onOpenChange={() => setConfirmDelete(false)}>
          <DialogContent className="max-w-sm p-6 bg-white shadow-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to delete this department?</p>
            </div>
            <DialogFooter>
              <Button
                onClick={handleDeleteDepartment}
                className="bg-destructive text-white hover:bg-destructive-dark text-xs py-1 px-4"
              >
                Yes, Delete
              </Button>
              <Button
  onClick={() => setConfirmDelete(false)}
  className="bg-secondary text-black hover:bg-secondary-dark text-xs py-1 px-4"
>
  Cancel
</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DepartmentManagement;
