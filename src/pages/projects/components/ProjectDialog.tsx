import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TablesInsert } from "@/integrations/supabase/project_types";

type NewProject = TablesInsert<"projects">;

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  project: NewProject;
  setProject: (p: NewProject) => void;
  onSave: () => void;
}

export default function ProjectDialog({ open, onClose, project, setProject, onSave }: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} />
          <Label>Description</Label>
          <Textarea value={project.description ?? ""} onChange={(e) => setProject({ ...project, description: e.target.value })} />
          <Label>Start Date</Label>
          <Input type="date" value={project.start_date ?? ""} onChange={(e) => setProject({ ...project, start_date: e.target.value })} />
          <Label>End Date</Label>
          <Input type="date" value={project.end_date ?? ""} onChange={(e) => setProject({ ...project, end_date: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save Project</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
