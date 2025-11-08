import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial?: string;
}

interface Project {
  project_id: number;
  project_name: string;
  project_code: string;
}

interface Task {
  id: number;
  task_id: number;
  description: string;
  start_date: string | null;
  end_date: string | null;
  assigned_employee_id: number | null;
  created_at: string;
  updated_at: string;
  task?: { task_name: string };
  employee?: Employee | null;
}

const ProjectTasks = ({ project, onBack }: { project: Project; onBack: () => void }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<{ id: number; task_name: string }[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  // Fetch all employees
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name, middle_initial")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to fetch employees");
      console.error(error);
      return;
    }
    setEmployees(data || []);
  };

  // Fetch all available tasks from master table
  const fetchAvailableTasks = async () => {
    const { data, error } = await supabase.from("m9_tasks").select("id, task_name").order("created_at");
    if (error) {
      toast.error("Failed to fetch available tasks");
      console.error(error);
      return;
    }
    setAvailableTasks(data || []);
  };

  // Fetch assigned employees for this project
  const fetchAssignedEmployees = async () => {
    if (!project?.project_id) return;
    const { data, error } = await supabase
      .from("m9_project_employees")
      .select("employee_id, employees(id, first_name, last_name, middle_initial)")
      .eq("project_id", project.project_id);

    if (error) {
      toast.error("Failed to fetch assigned employees");
      console.error(error);
      return;
    }

    const assigned = data?.map((row: any) => row.employees) || [];
    setAssignedEmployees(assigned);
  };

  // Fetch project tasks with task and employee details
  const fetchTasks = async () => {
    if (!project?.project_id) return;
    const { data, error } = await supabase
      .from("m9_project_tasks")
      .select(`
        id,
        project_id,
        task_id,
        description,
        start_date,
        end_date,
        assigned_employee_id,
        created_at,
        updated_at,
        m9_tasks(task_name),
        m9_project_employees:assigned_employee_id (employees(id, first_name, last_name, middle_initial))
      `)
      .eq("project_id", project.project_id)
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to fetch project tasks");
      console.error(error);
      return;
    }

    const mappedTasks: Task[] =
      data?.map((t: any) => ({
        id: t.id,
        task_id: t.task_id,
        description: t.description,
        start_date: t.start_date,
        end_date: t.end_date,
        assigned_employee_id: t.assigned_employee_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        task: t.m9_tasks || null,
        employee: t.m9_project_employees?.employees || null,
      })) || [];

    setTasks(mappedTasks);
  };

  useEffect(() => {
    fetchEmployees();
    fetchAvailableTasks();
    fetchAssignedEmployees();
    fetchTasks();
  }, [project]);

  /** Add employee to project */
  const handleAddEmployee = async () => {
    if (!selectedEmployeeId) return toast.error("Select an employee");
    if (!project?.project_id) return toast.error("Project not selected properly");

    if (assignedEmployees.find((e) => e.id.toString() === selectedEmployeeId)) {
      return toast.error("Employee already assigned");
    }

    const { error } = await supabase.from("m9_project_employees").insert([
      {
        project_id: project.project_id,
        employee_id: Number(selectedEmployeeId),
      },
    ]);

    if (error) {
      toast.error("Failed to assign employee");
      console.error(error);
      return;
    }

    await fetchAssignedEmployees();
    toast.success("Employee successfully assigned");
    setSelectedEmployeeId("");
  };

  /** Add task to project */
  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!project?.project_id) return toast.error("Project not selected properly");

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const taskId = formData.get("task_id")?.toString();
    const description = formData.get("description")?.toString() || "";
    const startDate = formData.get("start_date")?.toString() || null;
    const endDate = formData.get("end_date")?.toString() || null;
    const assignedEmpId = formData.get("task_employee")?.toString() || null;

    if (!taskId) return toast.error("Select a task");

    const { error } = await supabase.from("m9_project_tasks").insert([
      {
        project_id: project.project_id,
        task_id: Number(taskId),
        description,
        start_date: startDate,
        end_date: endDate,
        assigned_employee_id: assignedEmpId ? Number(assignedEmpId) : null,
      },
    ]);

    if (error) {
      toast.error("Failed to add task");
      console.error(error);
      return;
    }

    toast.success("Task added successfully");
    await fetchTasks();
    setTaskDialogOpen(false);
  };

  const formatEmployeeName = (emp: Employee | undefined) =>
    emp
      ? `${emp.first_name} ${emp.middle_initial ? emp.middle_initial + ". " : ""}${emp.last_name}`
      : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{project.project_name}</h2>
          <p className="text-sm text-muted-foreground">
            Project Code: {project.project_code}
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back to Projects
        </Button>
      </div>

      {/* Assign Employees */}
      <Card>
        <CardHeader>
          <CardTitle>Assign Employees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-center">
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {formatEmployeeName(emp)}
                </option>
              ))}
            </select>
            <Button onClick={handleAddEmployee}>Add</Button>
          </div>

          {assignedEmployees.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold">Assigned Employees</h3>
              <ul className="list-disc list-inside">
                {assignedEmployees.map((emp) => (
                  <li key={emp.id}>{formatEmployeeName(emp)}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setTaskDialogOpen(true)}>Add Task</Button>

          {tasks.length === 0 ? (
            <p className="mt-4 text-muted-foreground">No tasks yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {tasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <CardTitle>{task.task?.task_name || `Task #${task.task_id}`}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p><strong>Description:</strong> {task.description}</p>
                    <p>
                      <strong>Start:</strong> {task.start_date || "N/A"} |{" "}
                      <strong>End:</strong> {task.end_date || "N/A"}
                    </p>
                    <p>
                      <strong>Assigned to:</strong>{" "}
                      {task.employee
                        ? formatEmployeeName(task.employee)
                        : "Unassigned"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <Label>Task</Label>
              <select name="task_id" className="border rounded px-2 py-1 w-full" required>
                <option value="">Select Task</option>
                {availableTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.task_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Input name="description" />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" name="start_date" />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" name="end_date" />
            </div>
            <div>
              <Label>Assign Employee (optional)</Label>
              <select name="task_employee" className="border rounded px-2 py-1 w-full">
                <option value="">Select Assigned Employee</option>
                {assignedEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {formatEmployeeName(emp)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectTasks;
