'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Supplier {
  id: string;
  name: string;
  contact_info: string | null;
  address: string | null;
  contract: "direct" | "indirect"; // Added contract field
  created_at: string;
}

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form fields
  const [name, setName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [address, setAddress] = useState("");
  const [contract, setContract] = useState<"direct" | "indirect">("direct"); // default value

  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchSuppliers(searchTerm);
  }, [searchTerm]);

  async function fetchSuppliers(search: string = "") {
    setLoading(true);

    let query = supabase
      .from("suppliers")
      .select("*")
      .order("created_at", { ascending: false });

    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error fetching suppliers", description: error.message });
    } else {
      setSuppliers(data || []);
    }

    setLoading(false);
  }

  function openAddModal() {
    setEditingSupplier(null);
    setName("");
    setContactInfo("");
    setAddress("");
    setContract("direct");
    setOpen(true);
  }

  function openEditModal(supplier: Supplier) {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setContactInfo(supplier.contact_info || "");
    setAddress(supplier.address || "");
    setContract(supplier.contract);
    setOpen(true);
  }

  async function handleAddSupplier() {
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Supplier name is required." });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("suppliers").insert({
      name: name.trim(),
      contact_info: contactInfo.trim() || null,
      address: address.trim() || null,
      contract,
    });

    if (error) {
      toast({ title: "Error adding supplier", description: error.message });
    } else {
      toast({ title: "Supplier added", description: `${name} added successfully.` });
      setOpen(false);
      fetchSuppliers(searchTerm);
    }

    setLoading(false);
  }

  async function handleUpdateSupplier() {
    if (!editingSupplier) return;

    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Supplier name is required." });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("suppliers")
      .update({
        name: name.trim(),
        contact_info: contactInfo.trim() || null,
        address: address.trim() || null,
        contract,
      })
      .eq("id", editingSupplier.id);

    if (error) {
      toast({ title: "Error updating supplier", description: error.message });
    } else {
      toast({ title: "Supplier updated", description: `${name} updated successfully.` });
      setOpen(false);
      fetchSuppliers(searchTerm);
    }

    setLoading(false);
  }

  async function handleDeleteSupplier(id: string, name: string) {
    const confirmed = window.confirm(`Are you sure you want to delete supplier "${name}"?`);
    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase.from("suppliers").delete().eq("id", id);

    if (error) {
      toast({ title: "Error deleting supplier", description: error.message });
    } else {
      toast({ title: "Supplier deleted", description: `${name} was deleted successfully.` });
      fetchSuppliers(searchTerm);
    }

    setLoading(false);
  }

  function handleSubmit() {
    if (editingSupplier) {
      handleUpdateSupplier();
    } else {
      handleAddSupplier();
    }
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold">Suppliers</h2>

        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-64"
          />
          <Button onClick={openAddModal}>Add Supplier</Button>
        </div>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && suppliers.length === 0 && <p>No suppliers found.</p>}

      {!loading && suppliers.length > 0 && (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2 text-left">Name</th>
              <th className="border border-gray-300 p-2 text-left">Contact Info</th>
              <th className="border border-gray-300 p-2 text-left">Address</th>
              <th className="border border-gray-300 p-2 text-left">Contract</th>
              <th className="border border-gray-300 p-2 text-left">Created At</th>
              <th className="border border-gray-300 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="even:bg-gray-50">
                <td className="border border-gray-300 p-2">{supplier.name}</td>
                <td className="border border-gray-300 p-2">{supplier.contact_info || "-"}</td>
                <td className="border border-gray-300 p-2">{supplier.address || "-"}</td>
                <td className="border border-gray-300 p-2 capitalize">{supplier.contract}</td>
                <td className="border border-gray-300 p-2">
                  {supplier.created_at
                    ? format(new Date(supplier.created_at), "PPP p")
                    : "-"}
                </td>
                <td className="border border-gray-300 p-2 space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEditModal(supplier)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Update the supplier details below."
                : "Fill the form below to add a supplier."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="name" className="block font-semibold mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Supplier Name"
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className="block font-semibold mb-1">
                Contact Info
              </label>
              <Input
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Phone, Email, etc."
              />
            </div>

            <div>
              <label htmlFor="address" className="block font-semibold mb-1">
                Address
              </label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Supplier Address"
              />
            </div>

            <div>
              <label htmlFor="contract" className="block font-semibold mb-1">
                Contract <span className="text-red-500">*</span>
              </label>
              <select
                id="contract"
                value={contract}
                onChange={(e) => setContract(e.target.value as "direct" | "indirect")}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                required
              >
                <option value="direct">Direct</option>
                <option value="indirect">Indirect</option>
              </select>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-6">
            <Button
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading
                ? editingSupplier
                  ? "Updating..."
                  : "Adding..."
                : editingSupplier
                ? "Update Supplier"
                : "Add Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
