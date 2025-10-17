import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface ProjectsModalProps {
  open: boolean;
  onClose: () => void;
  projectTypes: { project_type_id: number; type_name: string }[];
}

export default function ProjectsModal({
  open,
  onClose,
  projectTypes,
}: ProjectsModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectTypeId, setProjectTypeId] = useState("");
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Generate unique project code
  const generateProjectCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PRJ-${Date.now()}-${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const newProject = {
      project_code: generateProjectCode(),
      project_name: projectName.trim(),
      project_type_id: projectTypeId ? Number(projectTypeId) : null,
      expected_end_date: expectedEndDate || null,
      estimated_cost: estimatedCost ? Number(estimatedCost) : null,
      status,
    };

    console.log("📤 Attempting to insert:", newProject);

    const { data, error } = await supabase.from("m9_projects").insert(newProject).select();

    setLoading(false);

    if (error) {
      console.error("❌ Error adding project:", error);
      setMessage(`Error: ${error.message}`);
      return;
    }

    console.log("✅ Successfully inserted:", data);
    setMessage("✅ Project added successfully!");

    // Reset form
    setProjectName("");
    setProjectTypeId("");
    setExpectedEndDate("");
    setEstimatedCost("");
    setStatus("Not Started");

    // Optionally close modal after success
    setTimeout(() => {
      setMessage(null);
      onClose();
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Project Name</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              placeholder="Enter project name"
            />
          </div>

          <div>
            <Label>Project Type</Label>
            <Select value={projectTypeId} onValueChange={setProjectTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project type" />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.length === 0 ? (
                  <SelectItem value="" disabled>
                    No active types
                  </SelectItem>
                ) : (
                  projectTypes.map((type) => (
                    <SelectItem
                      key={type.project_type_id}
                      value={String(type.project_type_id)}
                    >
                      {type.type_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Not Started">Not Started</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Expected End Date</Label>
            <Input
              type="date"
              value={expectedEndDate}
              onChange={(e) => setExpectedEndDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Estimated Cost</Label>
            <Input
              type="number"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="Enter amount in ₱"
            />
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.startsWith("Error") ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Adding..." : "Add Project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
