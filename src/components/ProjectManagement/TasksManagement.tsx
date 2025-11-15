import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash } from "lucide-react";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";

interface Task {
  name: string;
  price: number;
}

interface ProjectTask {
  id: string;
  task_code: string;
  project_id: string;
  tasks: Task[];
  assigned_to: number | null;
  total_labor: number;
  project?: {
    project_name: string;
    project_code: string;
  };
  employee?: {
    first_name: string;
    last_name: string;
  };
}

export const TasksManagement = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<ProjectTask | null>(null);
  const queryClient = useQueryClient();

  const { data: projectTasks, isLoading } = useQuery({
    queryKey: ["project_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          *,
          project:projects(project_name, project_code),
          employee:employees(first_name, last_name)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any as ProjectTask[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tasks Management</h2>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Include Task
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Code</TableHead>
              <TableHead>Project Code</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Included Tasks</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Total Labor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : projectTasks?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              projectTasks?.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.task_code}</TableCell>
                  <TableCell>{task.project?.project_code || "-"}</TableCell>
                  <TableCell>{task.project?.project_name || "-"}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {task.tasks.map((t, idx) => (
                        <div key={idx} className="text-sm">
                          {t.name} - {formatCurrency(t.price)}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.employee
                      ? `${task.employee.first_name} ${task.employee.last_name}`
                      : "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(task.total_labor)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(task.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddTaskDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      {editTask && (
        <EditTaskDialog
          task={editTask}
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
        />
      )}
    </div>
  );
};