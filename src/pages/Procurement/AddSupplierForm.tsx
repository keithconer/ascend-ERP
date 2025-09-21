import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui"; // Assuming these components exist

export const AddSupplierForm = ({ onClose, supplierToEdit, onSuccess }) => {
  const [name, setName] = useState(supplierToEdit?.name || "");
  const [contactInfo, setContactInfo] = useState(supplierToEdit?.contact_info || "");

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setContactInfo(supplierToEdit.contact_info);
    }
  }, [supplierToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (supplierToEdit) {
      // Update the supplier
      const { error } = await supabase
        .from("suppliers")
        .update({ name, contact_info: contactInfo })
        .eq("id", supplierToEdit.id);

      if (error) {
        console.error("Error updating supplier:", error.message);
      } else {
        onSuccess();
        onClose();
      }
    } else {
      // Add a new supplier
      const { error } = await supabase.from("suppliers").insert([
        { name, contact_info: contactInfo },
      ]);

      if (error) {
        console.error("Error adding supplier:", error.message);
      } else {
        onSuccess();
        onClose();
      }
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Contact Info</label>
          <Input
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            required
          />
        </div>
        <div className="flex space-x-2">
          <Button type="submit">{supplierToEdit ? "Update" : "Add"} Supplier</Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
