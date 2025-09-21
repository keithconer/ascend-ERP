import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export const SupplierManagement = () => {
  const { data: suppliers, isLoading, refetch } = useQuery({
    queryKey: ["suppliers", "active"],  // Key specific to active suppliers
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc("proc1", { is_active: true });  // RPC to fetch active suppliers
      if (error) throw error;

      // Ensure date fields are properly formatted
      return data.map(supplier => ({
        ...supplier,
        created_at: supplier.created_at ? new Date(supplier.created_at).toLocaleString() : "N/A",
        updated_at: supplier.updated_at ? new Date(supplier.updated_at).toLocaleString() : "N/A",
      }));
    },
  });

  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error, data } = await supabase.from("suppliers").insert([
      {
        name,
        contact_info: contactInfo,
        is_active: isActive, // Ensure active status is passed correctly
      },
    ]);

    if (error) {
      setErrorMessage("Failed to add supplier: " + error.message);
      console.error("Failed to add supplier:", error.message);
    } else {
      // Refetch data to reflect new supplier in the list
      refetch();
      setOpen(false);
      setName("");
      setContactInfo("");
      setIsActive(true); // Reset after successful submission
      setErrorMessage(""); // Clear error message
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) {
        console.error("Error deleting supplier:", error.message);
      } else {
        refetch(); // Refresh the data after deletion
      }
    }
  };

  if (isLoading) {
    return <p>Loading suppliers...</p>;
  }

  return (
    <div className="p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Supplier Management</CardTitle>

          {/* Dialog Trigger */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add Supplier</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Contact Info</label>
                  <Input
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Status</label>
                  <Select
                    value={isActive ? "active" : "inactive"}
                    onValueChange={(value) => setIsActive(value === "active")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {errorMessage && <p className="text-red-500">{errorMessage}</p>}

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead> {/* New column for date */}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>{supplier.id}</TableCell>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_info}</TableCell>
                  <TableCell className="capitalize">
                    {supplier.is_active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell>{supplier.created_at}</TableCell> {/* Display the date */}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(supplier.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
