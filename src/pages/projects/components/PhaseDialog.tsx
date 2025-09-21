//ascend-ERP/src/pages/projects/components/PhaseDialog.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TablesInsert } from "@/integrations/supabase/project_types";

type NewPhase = TablesInsert<"project_phases">;

interface PhaseDialogProps {
  open: boolean;
  onClose: () => void;
  phase: NewPhase;
  setPhase: (p: NewPhase) => void;
  onSave: () => void;
}

export default function PhaseDialog({ open, onClose, phase, setPhase, onSave }: PhaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Phase</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Phase Name</Label>
          <Input value={phase.name} onChange={(e) => setPhase({ ...phase, name: e.target.value })} />
          <Label>Description</Label>
          <Textarea value={phase.description ?? ""} onChange={(e) => setPhase({ ...phase, description: e.target.value })} />
          <Label>Start Date</Label>
          <Input type="date" value={phase.start_date ?? ""} onChange={(e) => setPhase({ ...phase, start_date: e.target.value })} />
          <Label>End Date</Label>
          <Input type="date" value={phase.end_date ?? ""} onChange={(e) => setPhase({ ...phase, end_date: e.target.value })} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save Phase</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
