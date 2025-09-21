// src/pages/projects/components/ResourceAssignmentDialog.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablesInsert, Tables } from "@/integrations/supabase/project_types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseProject } from "@/integrations/supabase/client";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

type TaskAssignment = Tables<"task_assignments">;
type NewTaskAssignment = TablesInsert<"task_assignments">;

type Employee = Tables<"employees">;
type Equipment = Tables<"equipment">;

interface ResourceAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  employees: Employee[];
  equipment: Equipment[];
  onSave: (assignment: NewTaskAssignment) => void;
}

export default function ResourceAssignmentDialog({
  open,
  onClose,
  taskId,
  employees,
  equipment,
  onSave,
}: ResourceAssignmentDialogProps) {
  const qc = useQueryClient();

  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [allocatedHours, setAllocatedHours] = useState<number>(0);
  const [budget, setBudget] = useState<number>(0);

  // Mutation to save assignment
  const createAssignment = useMutation({
    mutationFn: async (payload: NewTaskAssignment) => {
      const { error } = await supabaseProject.from("task_assignments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task_assignments"] });
      onClose();
      // reset fields
      setSelectedEmployee("");
      setSelectedEquipment("");
      setAllocatedHours(0);
      setBudget(0);
    },
  });

  const handleSave = () => {
    if (!selectedEmployee || !selectedEquipment) return;
    const payload: NewTaskAssignment = {
      task_id: taskId,
      employee_id: selectedEmployee,
      equipment_id: selectedEquipment,
      allocated_hours: allocatedHours,
      budget_allocated: budget,
    };
    createAssignment.mutate(payload);
    onSave(payload);
  };

  useEffect(() => {
    if (!open) {
      setSelectedEmployee("");
      setSelectedEquipment("");
      setAllocatedHours(0);
      setBudget(0);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Resources</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label>Employee</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} ({e.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Equipment</Label>
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger>
              <SelectValue placeholder="Select equipment" />
            </SelectTrigger>
            <SelectContent>
              {equipment.map((eq) => (
                <SelectItem key={eq.id} value={eq.id}>
                  {eq.name} (Qty: {eq.quantity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Allocated Hours</Label>
          <Input
            type="number"
            min={0}
            value={allocatedHours}
            onChange={(e) => setAllocatedHours(Number(e.target.value))}
          />

          <Label>Budget Allocated</Label>
          <Input
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
