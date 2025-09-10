// C:\school\ERP\src\pages\projects\ProjectManagement.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseProject } from "@/integrations/supabase/client";
import { ERPLayout } from "@/components/erp/ERPLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ✅ Import types
import type { Tables, TablesInsert } from "@/integrations/supabase/project_types";

type Project = Tables<"projects">;
type NewProject = TablesInsert<"projects">;
type Task = Tables<"tasks">;
type NewTask = TablesInsert<"tasks">;
type Resource = Tables<"resources">;
type NewResource = TablesInsert<"resources">;

export default function ProjectManagement() {
  const queryClient = useQueryClient();

  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddTask, setShowAddTask] = useState<string | null>(null);
  const [showAddResource, setShowAddResource] = useState<string | null>(null);

  const [newProject, setNewProject] = useState<NewProject>({
    name: "",
    description: "",
    start_date: null,
    end_date: null,
    status: "planned",
  });

  const [newTask, setNewTask] = useState<NewTask>({
    name: "",
    status: "pending",
    project_id: "",
  });

  const [newResource, setNewResource] = useState<NewResource>({
    name: "",
    type: "",
    cost: 0,
    task_id: "",
  });

  // ✅ Fetch projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("projects").select("*");
      if (error) throw error;
      return data as Project[];
    },
  });

  // ✅ Fetch tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("tasks").select("*");
      if (error) throw error;
      return data as Task[];
    },
  });

  // ✅ Fetch resources
  const { data: resources } = useQuery<Resource[]>({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("resources").select("*");
      if (error) throw error;
      return data as Resource[];
    },
  });

  // ✅ Mutation: add new project
  const addProject = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseProject.from("projects").insert([newProject]);
      if (error) throw error;
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        alert("Error saving project: " + err.message);
      } else {
        alert("Error saving project.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowAddProject(false);
      setNewProject({
        name: "",
        description: "",
        start_date: null,
        end_date: null,
        status: "planned",
      });
    },
  });

  // ✅ Mutation: add task
  const addTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseProject.from("tasks").insert([newTask]);
      if (error) throw error;
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        alert("Error saving task: " + err.message);
      } else {
        alert("Error saving task.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowAddTask(null);
      setNewTask({ name: "", status: "pending", project_id: "" });
    },
  });

  // ✅ Mutation: add resource
  const addResource = useMutation({
    mutationFn: async () => {
      const { error } = await supabaseProject.from("resources").insert([newResource]);
      if (error) throw error;
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        alert("Error saving resource: " + err.message);
      } else {
        alert("Error saving resource.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      setShowAddResource(null);
      setNewResource({ name: "", type: "", cost: 0, task_id: "" });
    },
  });

  return (
    <ERPLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Project Management
            </h1>
            <p className="text-muted-foreground">
              Plan, schedule, allocate resources, and track the progress of your
              projects
            </p>
          </div>
          <Button onClick={() => setShowAddProject(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                All projects created
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* ✅ Projects Tab */}
          <TabsContent value="projects">
            <div className="space-y-2">
              {projects?.map((project) => {
                const projectTasks =
                  tasks?.filter((t) => t.project_id === project.id) || [];
                const projectResources =
                  resources?.filter((r) =>
                    projectTasks.some((t) => t.id === r.task_id)
                  ) || [];

                return (
                  <Card key={project.id}>
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                      <p className="text-xs mt-1">
                        {project.start_date} → {project.end_date || "Ongoing"}
                      </p>

                      {/* Tasks */}
                      <div className="mt-4">
                        <h3 className="font-semibold">Tasks</h3>
                        {projectTasks.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {projectTasks.map((task) => (
                              <li key={task.id}>
                                {task.name} ({task.status})
                                <Button
                                  size="sm"
                                  className="ml-2"
                                  onClick={() => {
                                    setShowAddResource(task.id);
                                    setNewResource({
                                      ...newResource,
                                      task_id: task.id,
                                    });
                                  }}
                                >
                                  <Plus className="mr-1 h-3 w-3" /> Resource
                                </Button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No tasks yet.
                          </p>
                        )}
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setShowAddTask(project.id);
                            setNewTask({
                              ...newTask,
                              project_id: project.id,
                            });
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" /> Task
                        </Button>
                      </div>

                      {/* Resources */}
                      <div className="mt-4">
                        <h3 className="font-semibold">Resources</h3>
                        {projectResources.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {projectResources.map((res) => (
                              <li key={res.id}>
                                {res.name} — {res.type} — ₱{res.cost}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            No resources yet.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {projects?.length === 0 && (
                <p className="text-muted-foreground">
                  No projects yet. Add one above.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ✅ Budget Tab */}
          <TabsContent value="budget">
            <div className="space-y-4">
              {projects?.map((project) => {
                const projectTasks =
                  tasks?.filter((t) => t.project_id === project.id) || [];
                const projectResources =
                  resources?.filter((r) =>
                    projectTasks.some((t) => t.id === r.task_id)
                  ) || [];
                const totalCost = projectResources.reduce(
                  (sum, r) => sum + (r.cost ?? 0),
                  0
                );

                return (
                  <Card key={project.id}>
                    <CardHeader>
                      <CardTitle>{project.name} — Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Total Resource Cost: ₱{totalCost.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ✅ Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-4">
              {projects?.map((project) => {
                const projectTasks =
                  tasks?.filter((t) => t.project_id === project.id) || [];
                const completedTasks = projectTasks.filter(
                  (t) => t.status === "completed"
                ).length;
                const completionRate = projectTasks.length
                  ? Math.round(
                      (completedTasks / projectTasks.length) * 100
                    )
                  : 0;

                return (
                  <Card key={project.id}>
                    <CardHeader>
                      <CardTitle>{project.name} — Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>
                        {completedTasks}/{projectTasks.length} tasks completed (
                        {completionRate}%)
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Project Dialog */}
        <Dialog open={showAddProject} onOpenChange={setShowAddProject}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newProject.name ?? ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                  placeholder="Project Name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={newProject.description ?? ""}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
                  placeholder="Short description"
                />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newProject.start_date ?? ""}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      start_date: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={newProject.end_date ?? ""}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      end_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddProject(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addProject.mutate()}
                disabled={addProject.isPending}
              >
                {addProject.isPending ? "Saving..." : "Save Project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Task Dialog */}
        <Dialog open={!!showAddTask} onOpenChange={() => setShowAddTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Task Name</Label>
                <Input
                  value={newTask.name ?? ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, name: e.target.value })
                  }
                  placeholder="Task Name"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Input
                  value={newTask.status ?? ""}
                  onChange={(e) =>
                    setNewTask({ ...newTask, status: e.target.value })
                  }
                  placeholder="pending / completed"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddTask(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => addTask.mutate()}
                disabled={addTask.isPending}
              >
                {addTask.isPending ? "Saving..." : "Save Task"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Resource Dialog */}
        <Dialog
          open={!!showAddResource}
          onOpenChange={() => setShowAddResource(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Resource Name</Label>
                <Input
                  value={newResource.name ?? ""}
                  onChange={(e) =>
                    setNewResource({ ...newResource, name: e.target.value })
                  }
                  placeholder="Resource Name"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Input
                  value={newResource.type ?? ""}
                  onChange={(e) =>
                    setNewResource({ ...newResource, type: e.target.value })
                  }
                  placeholder="Material / Labor"
                />
              </div>
              <div>
                <Label>Cost</Label>
                <Input
                  type="number"
                  value={newResource.cost ?? 0}
                  onChange={(e) =>
                    setNewResource({
                      ...newResource,
                      cost: Number(e.target.value),
                    })
                  }
                  placeholder="Cost"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddResource(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => addResource.mutate()}
                disabled={addResource.isPending}
              >
                {addResource.isPending ? "Saving..." : "Save Resource"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ERPLayout>
  );
}
