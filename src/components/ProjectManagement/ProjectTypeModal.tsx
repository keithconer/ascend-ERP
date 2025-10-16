// src/components/ProjectManagement/ProjectTypeModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProjectTypeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { type_name: string; description: string }) => void;
}

export default function ProjectTypeModal({ open, onClose, onSave }: ProjectTypeModalProps) {
  const [typeName, setTypeName] = useState("");
  const [description, setDescription] = useState("");

  const handleSave = () => {
    if (!typeName.trim()) return alert("Project Type name is required");
    onSave({ type_name: typeName, description });
    setTypeName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Project Type</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Type Name</Label>
            <Input
              placeholder="Enter project type name"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
