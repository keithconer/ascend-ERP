import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface Task {
  name: string;
  price: number;
  assigned_to: number | null;
}

interface ProjectTask {
  id: string;
  task_code: string;
  project_id: string;
  tasks: Task[];
  assigned_to: number | null;
  total_labor: number;
}

interface EditTaskDialogProps {
  task: ProjectTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTaskDialog = ({ task, open, onOpenChange }: EditTaskDialogProps) => {
  const [projectId, setProjectId] = useState(task.project_id);
  const [tasks, setTasks] = useState<Task[]>(task.tasks);
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, project_code, project_name")
        .order("project_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name")
        .order("first_name");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setProjectId(task.project_id);
    setTasks(task.tasks);
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const total = tasks.reduce((sum, t) => sum + (t.price || 0), 0);
      const { error } = await supabase
        .from("project_tasks")
        .update({
          project_id: projectId,
          tasks: tasks as any,
          assigned_to: null,
          total_labor: total,
        })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Task updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });

  const handleAddTask = () => {
    setTasks([...tasks, { name: "", price: 0, assigned_to: null }]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (
    index: number,
    field: keyof Task,
    value: string | number
  ) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };

  const totalLabor = tasks.reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }
    if (tasks.some((t) => !t.name || !t.price || !t.assigned_to)) {
      toast.error("Please fill in all task fields");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Task Code</Label>
            <Input value={task.task_code} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_code} - {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Included Tasks *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTask}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
            <div className="space-y-3">
              {tasks.map((t, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start p-3 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Task name"
                      value={t.name}
                      onChange={(e) =>
                        handleTaskChange(index, "name", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Price (₱)"
                      value={t.price || ""}
                      onChange={(e) =>
                        handleTaskChange(
                          index,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <Select
                      value={t.assigned_to?.toString() || ""}
                      onValueChange={(value) =>
                        handleTaskChange(index, "assigned_to", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Assign employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.first_name} {employee.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {tasks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTask(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Labor:</span>
              <span className="text-lg font-bold">
                ₱{totalLabor.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};