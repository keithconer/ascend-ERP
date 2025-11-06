import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Task {
  id: number;
  task_code: string;
  task_name: string;
  description: string;
  created_at: string;
}

export default function TasksTab() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all global tasks
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("m9_tasks")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load tasks");
      console.error(error);
      return;
    }

    setTasks(data || []);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Generate task code like TASK-0001
  const generateTaskCode = () => {
    const nextNum = (tasks.length + 1).toString().padStart(4, "0");
    return `TASK-${nextNum}`;
  };

  // Add new global task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return toast.error("Task name is required");

    setIsLoading(true);

    const newTaskCode = generateTaskCode();

    const { data, error } = await supabase
      .from("m9_tasks")
      .insert([
        {
          task_code: newTaskCode,
          task_name: taskName.trim(),
          description: description.trim(),
        },
      ])
      .select("*")
      .single();

    setIsLoading(false);

    if (error) {
      toast.error("Failed to add task");
      console.error(error);
      return;
    }

    toast.success(`Task ${newTaskCode} added`);
    setTasks([...tasks, data]);
    setTaskName("");
    setDescription("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h2 className="text-2xl font-bold">Task Templates</h2>
      <p className="text-muted-foreground">
        Create and manage reusable tasks that can be assigned to any project.
      </p>

      {/* Add Task Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <Label>Task Name</Label>
              <Input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="Enter task name"
                required
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description (optional)"
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-muted-foreground">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="border p-3 rounded-lg hover:bg-muted transition"
                >
                  <p className="font-medium">
                    {task.task_code} — {task.task_name}
                  </p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
