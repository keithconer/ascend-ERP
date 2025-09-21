// src/pages/projects/components/TaskDialog.tsx
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tables, TablesInsert } from "@/integrations/supabase/project_types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseProject } from "@/integrations/supabase/client";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue
} from "@/components/ui/select";


type Task = Tables<"tasks">;
type NewTask = TablesInsert<"tasks">;

type TaskDependency = Tables<"task_dependencies">;
type NewTaskDependency = TablesInsert<"task_dependencies">;

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  task: NewTask;
  setTask: React.Dispatch<React.SetStateAction<NewTask>>;
  onSave: () => void;
  error?: string | null;
  allTasks: Task[];
}

export default function TaskDialog({
  open,
  onClose,
  task,
  setTask,
  onSave,
  error,
  allTasks,
}: TaskDialogProps) {
  const qc = useQueryClient();
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  // Mutation for inserting dependencies
  const createDependencies = useMutation({
    mutationFn: async (deps: NewTaskDependency[]) => {
      const { error } = await supabaseProject.from("task_dependencies").insert(deps);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task_dependencies"] });
    },
  });

  const handleSave = async () => {
    await onSave(); // save the task itself
    if (selectedDependencies.length > 0 && task.id) {
      const deps: NewTaskDependency[] = selectedDependencies.map((depId) => ({
        task_id: task.id as string,
        depends_on_task_id: depId,
      }));
      createDependencies.mutate(deps);
    }
    onClose();
  };

  // Reset dependencies when dialog closes
  useEffect(() => {
    if (!open) setSelectedDependencies([]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Task Name</Label>
            <Input
              value={task.name}
              onChange={(e) => setTask({ ...task, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={task.description ?? ""}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
            />
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={task.start_date ?? ""}
              onChange={(e) => setTask({ ...task, start_date: e.target.value })}
            />
          </div>

          <div>
            <Label>End Date</Label>
            <Input
              type="date"
              value={task.end_date ?? ""}
              onChange={(e) => setTask({ ...task, end_date: e.target.value })}
            />
          </div>

          <div>
            <Label>Status</Label>
            <Input
              value={task.status ?? "pending"}
              onChange={(e) => setTask({ ...task, status: e.target.value })}
            />
          </div>

          {/* Dependencies multi-select */}
          <div>
            <Label>Dependencies</Label>
            <Select
              value={selectedDependencies[0] ?? ""}
              onValueChange={(val) => {
                // toggle selection manually
                setSelectedDependencies((prev) =>
                  prev.includes(val) ? prev.filter((id) => id !== val) : [...prev, val]
                );
              }}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    selectedDependencies.length
                      ? `${selectedDependencies.length} task(s) selected`
                      : "Select dependent tasks"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {allTasks
                  .filter((t) => t.id !== task.id)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Task</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
