/* ======================  TASKS MANAGEMENT  ====================== */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash, Search } from "lucide-react";
import { AddTaskDialog } from "./AddTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";

interface Task { name: string; price: number; assigned_to: number | null; }
interface ProjectTask {
  id: string;
  task_code: string;
  project_id: string;
  tasks: Task[];
  assigned_to: number | null;
  total_labor: number;
  project?: { project_name: string; project_code: string };
}
interface Employee { id: number; first_name: string; last_name: string; }

export const TasksManagement = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<ProjectTask | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: projectTasks, isLoading } = useQuery({
    queryKey: ["project_tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select(`
          *,
          project:projects(project_name, project_code)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any as ProjectTask[];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, first_name, last_name");
      if (error) throw error;
      return data as Employee[];
    },
  });

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return projectTasks ?? [];
    const lower = searchTerm.toLowerCase();
    return (
      projectTasks?.filter(
        (t) =>
          t.task_code.toLowerCase().includes(lower) ||
          (t.project?.project_name ?? "").toLowerCase().includes(lower)
      ) ?? []
    );
  }, [projectTasks, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      toast.success("Task deleted successfully");
    },
    onError: () => toast.error("Failed to delete task"),
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tasks Management</h2>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Include Task
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by task code or project name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Code</TableHead>
              <TableHead>Project Code</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Included Tasks</TableHead>
              <TableHead>Total Labor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No tasks found</TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.task_code}</TableCell>
                  <TableCell>{task.project?.project_code || "-"}</TableCell>
                  <TableCell>{task.project?.project_name || "-"}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {task.tasks.map((t, idx) => {
                        const assignedEmployee = employees?.find(e => e.id === t.assigned_to);
                        return (
                          <div key={idx} className="text-sm">
                            {t.name} - {formatCurrency(t.price)}
                            {assignedEmployee && (
                              <span className="text-muted-foreground ml-2">
                                ({assignedEmployee.first_name} {assignedEmployee.last_name})
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
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