import { useState } from "react";
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

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTaskDialog = ({ open, onOpenChange }: AddTaskDialogProps) => {
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([{ name: "", price: 0, assigned_to: null }]);
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

  const addMutation = useMutation({
    mutationFn: async () => {
      const total = tasks.reduce((sum, task) => sum + (task.price || 0), 0);
      const { error } = await supabase.from("project_tasks").insert([{
        task_code: "",
        project_id: projectId,
        tasks: tasks as any,
        assigned_to: null,
        total_labor: total,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Task added successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add task");
    },
  });

  const resetForm = () => {
    setProjectId("");
    setTasks([{ name: "", price: 0, assigned_to: null }]);
  };

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

  const totalLabor = tasks.reduce((sum, task) => sum + (Number(task.price) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }
    if (tasks.some((task) => !task.name || !task.price || !task.assigned_to)) {
      toast.error("Please fill in all task fields");
      return;
    }
    addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Include Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              {tasks.map((task, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start p-3 border rounded-lg"
                >
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Task name (e.g., Implementing payment gateway)"
                      value={task.name}
                      onChange={(e) =>
                        handleTaskChange(index, "name", e.target.value)
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Price (₱)"
                      value={task.price || ""}
                      onChange={(e) =>
                        handleTaskChange(
                          index,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                    <Select
                      value={task.assigned_to?.toString() || ""}
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
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};