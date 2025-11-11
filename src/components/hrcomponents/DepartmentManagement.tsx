import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

type Department = {
  id: number;
  name: string;
};

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  // Delete states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteDeptId, setDeleteDeptId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch departments
  const fetchDepartments = async (filter = "") => {
    const query = supabase.from("departments").select("*");
    if (filter) {
      query.ilike("name", `%${filter}%`);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching departments:", error);
    } else {
      setDepartments(data || []);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Search effect
  useEffect(() => {
    fetchDepartments(searchTerm);
  }, [searchTerm]);

  // Add new department
  const handleAddDepartment = async () => {
    if (!newDeptName.trim()) return;

    const { error } = await supabase
      .from("departments")
      .insert([{ name: newDeptName.trim() }])
      .select()
      .single();

    if (error) {
      console.error("Error adding department:", error);
    } else {
      await fetchDepartments();
      setIsAddModalOpen(false);
      setNewDeptName("");
    }
  };

  // Update department
  const handleUpdateDepartment = async () => {
    if (!editingDept?.name.trim()) return;

    const { error } = await supabase
      .from("departments")
      .update({ name: editingDept.name.trim() })
      .eq("id", editingDept.id);

    if (error) {
      console.error("Error updating department:", error);
    } else {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id ? { ...d, name: editingDept.name.trim() } : d
        )
      );
      setEditingDept(null);
    }
  };

  // Delete department with FK constraint handling
  const handleDeleteDepartment = async () => {
    if (!deleteDeptId) return;

    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", deleteDeptId);

    if (error) {
      // Check for FK constraint error, show friendly message
      if (
        error.message.includes("foreign key") ||
        error.message.includes("violates foreign key constraint")
      ) {
        setDeleteError(
          "Cannot delete department because employees are assigned to it."
        );
      } else {
        setDeleteError("Failed to delete department: " + error.message);
      }
      return;
    }

    setDepartments((prev) => prev.filter((d) => d.id !== deleteDeptId));
    setDeleteError(null);
    setDeleteDeptId(null);
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header + Search + Add */}
      <div className="flex items-center justify-between space-x-4">
        <h2 className="text-2xl font-bold text-foreground">
          Department Management
        </h2>

        <div className="flex items-center space-x-4">
          {/* Search input */}
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

          {/* Add Department button */}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-3"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add New Department
          </Button>
        </div>
      </div>

      {/* Departments Table */}
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
                          setDeleteDeptId(dept.id);
                          setDeleteError(null);
                          setIsDeleteModalOpen(true);
                        }}
                        className="bg-destructive text-white hover:bg-destructive-dark text-xs py-1 px-2"
                      >
                        <Trash className="mr-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-4 text-gray-500"
                    >
                      No departments found.
                    </TableCell>
                  </TableRow>
                )}
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
              <label
                htmlFor="editDeptName"
                className="block text-sm font-semibold"
              >
                Department Name
              </label>
              <input
                id="editDeptName"
                type="text"
                value={editingDept.name}
                onChange={(e) =>
                  setEditingDept({ ...editingDept, name: e.target.value })
                }
                className="input input-bordered w-full"
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleUpdateDepartment}
                disabled={!editingDept.name.trim()}
                className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-4"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-lg p-6 bg-white shadow-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <label
                htmlFor="deptName"
                className="block text-sm font-semibold"
              >
                Department Name
              </label>
              <input
                id="deptName"
                type="text"
                placeholder="Enter Department Name"
                className="input input-bordered w-full"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleAddDepartment}
                disabled={!newDeptName.trim()}
                className="bg-primary text-white hover:bg-primary-dark text-xs py-1 px-4"
              >
                Save Department
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Delete Modal */}
      {isDeleteModalOpen && (
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="max-w-sm p-6 bg-white shadow-lg rounded-lg">
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to delete this department?</p>
              {deleteError && (
                <p className="text-red-600 font-semibold">{deleteError}</p>
              )}
            </div>
            <DialogFooter className="space-x-2">
              <Button
                onClick={handleDeleteDepartment}
                className="bg-destructive text-white hover:bg-destructive-dark text-xs py-1 px-4"
                disabled={!!deleteError}
                title={
                  deleteError
                    ? "Cannot delete department due to assigned employees"
                    : undefined
                }
              >
                Yes, Delete
              </Button>
              <Button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteDeptId(null);
                  setDeleteError(null);
                }}
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
