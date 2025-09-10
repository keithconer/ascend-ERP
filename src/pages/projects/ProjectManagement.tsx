// src/pages/projects/ProjectManagement.tsx
import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseProject } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/project_types";

import { ERPLayout } from "@/components/erp/ERPLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

// ---------- Types from project_types ----------
type Project = Tables<"projects">;
type NewProject = TablesInsert<"projects">;

type Task = Tables<"tasks">;
type NewTask = TablesInsert<"tasks">;

type Milestone = Tables<"milestones">;
type NewMilestone = TablesInsert<"milestones">;

type Resource = Tables<"resources">;
type NewResource = TablesInsert<"resources">;

type TaskDependency = TablesInsert<"task_dependencies">;
type TaskResource = TablesInsert<"task_resources">;

type ProjectBudget = Tables<"project_budgets">;
type NewProjectBudget = TablesInsert<"project_budgets">;

type Budget = Tables<"budgets">;
type NewBudget = TablesInsert<"budgets">;

type ProjectAlert = TablesInsert<"project_alerts">;

// ---------- Component ----------
export default function ProjectManagement() {
  const qc = useQueryClient();

  // Dialog states (ids): adding project / task / milestone / resource / assign / budgets / alerts
  const [openAddProject, setOpenAddProject] = useState(false);
  const [openAddTaskForProject, setOpenAddTaskForProject] = useState<string | null>(null);
  const [openAddMilestoneForProject, setOpenAddMilestoneForProject] = useState<string | null>(null);
  const [openAddResource, setOpenAddResource] = useState(false);
  const [openAssignResourceToTask, setOpenAssignResourceToTask] = useState<string | null>(null);
  const [openAddProjectBudgetForProject, setOpenAddProjectBudgetForProject] = useState<string | null>(null);
  const [openAddBudgetItemForProject, setOpenAddBudgetItemForProject] = useState<string | null>(null);
  const [openCreateAlertForProject, setOpenCreateAlertForProject] = useState<string | null>(null);

  // Form states
  const [newProject, setNewProject] = useState<NewProject>({
    name: "",
    description: "",
    status: "planning",
    start_date: null,
    end_date: null,
  });

  const [newTask, setNewTask] = useState<NewTask>({
    project_id: "",
    name: "",
    description: "",
    status: "todo",
    start_date: null,
    end_date: null,
    dependency_id: null,
  });

  const [newMilestone, setNewMilestone] = useState<NewMilestone>({
    project_id: "",
    name: "",
    due_date: null,
  });

  const [newResource, setNewResource] = useState<NewResource>({
    name: "",
    type: "",
    cost: 0,
    task_id: null,
  });

  const [assignResource, setAssignResource] = useState<TaskResource>({
    task_id: "",
    resource_id: "",
  });

  const [newProjectBudget, setNewProjectBudget] = useState<NewProjectBudget>({
    project_id: "",
    amount: 0,
  });

  const [newBudgetItem, setNewBudgetItem] = useState<NewBudget>({
    project_id: "",
    planned_amount: 0,
    actual_amount: 0,
  });

  const [newAlertMessage, setNewAlertMessage] = useState<string>("");

  // ---------- Queries: fetch all relevant tables ----------
  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("projects").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("tasks").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const { data: milestones } = useQuery<Milestone[]>({
    queryKey: ["milestones"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("milestones").select("*").order("due_date", { ascending: true });
      if (error) throw error;
      return data as Milestone[];
    },
  });

  const { data: resources } = useQuery<Resource[]>({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("resources").select("*").order("name", { ascending: true });
      if (error) throw error;
      return data as Resource[];
    },
  });

  const { data: taskDependencies } = useQuery({
    queryKey: ["task_dependencies"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("task_dependencies").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: taskResources } = useQuery({
    queryKey: ["task_resources"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("task_resources").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: projectBudgets } = useQuery<ProjectBudget[]>({
    queryKey: ["project_budgets"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("project_budgets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectBudget[];
    },
  });

  const { data: budgets } = useQuery<Budget[]>({
    queryKey: ["budgets"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("budgets").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Budget[];
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["project_alerts"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("project_alerts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ---------- Helper computed values ----------
  const tasksByProject = useMemo(() => {
    const map = new Map<string, Task[]>();
    (projects || []).forEach((p) => map.set(p.id, []));
    (tasks || []).forEach((t) => {
      if (!t.project_id) return;
      if (!map.has(t.project_id)) map.set(t.project_id, []);
      map.get(t.project_id)!.push(t);
    });
    return map;
  }, [projects, tasks]);

  const milestonesByProject = useMemo(() => {
    const map = new Map<string, Milestone[]>();
    (projects || []).forEach((p) => map.set(p.id, []));
    (milestones || []).forEach((m) => {
      if (!m.project_id) return;
      if (!map.has(m.project_id)) map.set(m.project_id, []);
      map.get(m.project_id)!.push(m);
    });
    return map;
  }, [projects, milestones]);

  const resourcesByTask = useMemo(() => {
    // map task_id -> resource[]
    const map = new Map<string, Resource[]>();
    (taskResources || []).forEach((tr: TaskResource) => {
      // tr = { task_id, resource_id }
      const res = (resources || []).find((r) => r.id === tr.resource_id);
      if (!res) return;
      if (!map.has(tr.task_id)) map.set(tr.task_id, []);
      map.get(tr.task_id)!.push(res);
    });
    return map;
  }, [taskResources, resources]);

  // compute budget totals per project
  const budgetTotalsByProject = useMemo(() => {
    const map = new Map<string, { allocated: number; planned: number; actual: number }>();
    (projects || []).forEach((p) => map.set(p.id, { allocated: 0, planned: 0, actual: 0 }));

    (projectBudgets || []).forEach((pb) => {
      if (!pb.project_id) return;
      const e = map.get(pb.project_id) ?? { allocated: 0, planned: 0, actual: 0 };
      e.allocated += Number(pb.amount ?? 0);
      map.set(pb.project_id, e);
    });

    (budgets || []).forEach((b) => {
      if (!b.project_id) return;
      const e = map.get(b.project_id) ?? { allocated: 0, planned: 0, actual: 0 };
      e.planned += Number(b.planned_amount ?? 0);
      e.actual += Number(b.actual_amount ?? 0);
      map.set(b.project_id, e);
    });

    return map;
  }, [projects, projectBudgets, budgets]);

  // ---------- Mutations (inserts / updates) ----------
  // Note: we keep these simple (no auth check). Make sure RLS / policies allow inserts for testing.
  const qcInvalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
    qc.invalidateQueries({ queryKey: ["milestones"] });
    qc.invalidateQueries({ queryKey: ["resources"] });
    qc.invalidateQueries({ queryKey: ["task_resources"] });
    qc.invalidateQueries({ queryKey: ["task_dependencies"] });
    qc.invalidateQueries({ queryKey: ["project_budgets"] });
    qc.invalidateQueries({ queryKey: ["budgets"] });
    qc.invalidateQueries({ queryKey: ["project_alerts"] });
  };

  const createProject = useMutation({
    mutationFn: async (payload: NewProject) => {
      const { error } = await supabaseProject.from("projects").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qcInvalidateAll();
      setOpenAddProject(false);
      setNewProject({ name: "", description: "", status: "planning", start_date: null, end_date: null });
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Create project error: ${err.message}`);
      else alert("Create project error");
    },
  });

  const createTask = useMutation({
    mutationFn: async (payload: NewTask) => {
      const { error } = await supabaseProject.from("tasks").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setOpenAddTaskForProject(null);
      setNewTask({ project_id: "", name: "", description: "", status: "todo", start_date: null, end_date: null, dependency_id: null });
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Create task error: ${err.message}`);
      else alert("Create task error");
    },
  });

  const createMilestone = useMutation({
    mutationFn: async (payload: NewMilestone) => {
      const { error } = await supabaseProject.from("milestones").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["milestones"] });
      setOpenAddMilestoneForProject(null);
      setNewMilestone({ project_id: "", name: "", due_date: null });
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Create milestone error: ${err.message}`);
      else alert("Create milestone error");
    },
  });

  const createResource = useMutation({
    mutationFn: async (payload: NewResource) => {
      const { error } = await supabaseProject.from("resources").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources"] });
      setOpenAddResource(false);
      setNewResource({ name: "", type: "", cost: 0, task_id: null });
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Create resource error: ${err.message}`);
      else alert("Create resource error");
    },
  });

  const assignResourceToTask = useMutation({
    mutationFn: async (payload: TaskResource) => {
      const { error } = await supabaseProject.from("task_resources").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task_resources"] });
      setOpenAssignResourceToTask(null);
      setAssignResource({ task_id: "", resource_id: "" });
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Assign resource error: ${err.message}`);
      else alert("Assign resource error");
    },
  });

  const createTaskDependency = useMutation({
    mutationFn: async (payload: TaskDependency) => {
      const { error } = await supabaseProject.from("task_dependencies").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task_dependencies"] });
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Create dependency error: ${err.message}`);
      else alert("Create dependency error");
    },
  });

  const createProjectBudget = useMutation({
    mutationFn: async (payload: NewProjectBudget) => {
      const { error } = await supabaseProject.from("project_budgets").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_budgets"] });
      setOpenAddProjectBudgetForProject(null);
      setNewProjectBudget({ project_id: "", amount: 0 });
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Create project budget error: ${err.message}`);
      else alert("Create project budget error");
    },
  });

  const createBudgetItem = useMutation({
    mutationFn: async (payload: NewBudget) => {
      const { error } = await supabaseProject.from("budgets").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setOpenAddBudgetItemForProject(null);
      setNewBudgetItem({ project_id: "", planned_amount: 0, actual_amount: 0 });
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Create budget item error: ${err.message}`);
      else alert("Create budget item error");
    },
  });

  const createAlert = useMutation({
    mutationFn: async (payload: ProjectAlert) => {
      const { error } = await supabaseProject.from("project_alerts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_alerts"] });
      setOpenCreateAlertForProject(null);
      setNewAlertMessage("");
    },
    onError: (err: unknown) => {
      if (err instanceof Error) alert(`Create alert error: ${err.message}`);
      else alert("Create alert error");
    },
  });

  // ---------- UI helpers ----------
  const formatCurrency = (v?: number) => {
    if (v == null) return "₱0";
    return `₱${Number(v).toLocaleString()}`;
  };

  // ---------- Render ----------
  return (
    <ERPLayout>
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">Planning, Resources, Budgets & Reports</p>
          </div>
          <div>
            <Button onClick={() => setOpenAddProject(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Project
            </Button>
          </div>
        </div>

        <Tabs defaultValue="planning" className="space-y-4">
          <TabsList>
            <TabsTrigger value="planning">Planning & Scheduling</TabsTrigger>
            <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
            <TabsTrigger value="budget">Budgeting & Cost Tracking</TabsTrigger>
            <TabsTrigger value="reports">Progress & Reports</TabsTrigger>
          </TabsList>

          {/* ---------------- PLANNING & SCHEDULING ---------------- */}
          <TabsContent value="planning">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold mb-2">Projects & Tasks</h2>

                {projects?.map((p) => {
                  const pTasks = tasksByProject.get(p.id) ?? [];
                  const pMilestones = milestonesByProject.get(p.id) ?? [];
                  const completed = pTasks.filter((t) => t.status === "completed").length;
                  const completionRate = pTasks.length ? Math.round((completed / pTasks.length) * 100) : 0;

                  return (
                    <Card key={p.id} className="mb-4">
                      <CardHeader className="flex justify-between items-center">
                        <div>
                          <CardTitle>{p.name}</CardTitle>
                          <div className="text-xs text-muted-foreground">{p.description}</div>
                          <div className="text-xs mt-1">{p.start_date ?? "—"} → {p.end_date ?? "—"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{completionRate}%</div>
                          <div className="text-xs text-muted-foreground">Progress</div>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="mb-3">
                          <h4 className="font-semibold">Tasks</h4>
                          {pTasks.length === 0 ? (
                            <div className="text-xs text-muted-foreground">No tasks yet</div>
                          ) : (
                            <ul className="list-disc pl-5">
                              {pTasks.map((t) => (
                                <li key={t.id} className="mb-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-medium">{t.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {t.description ?? ""}
                                        {" • "}
                                        {t.start_date ?? "—"} → {t.end_date ?? "—"}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs">{t.status}</div>
                                      <Button size="sm" onClick={() => { setOpenAssignResourceToTask(t.id); setAssignResource({ ...assignResource, task_id: t.id }); }}>
                                        Assign Resource
                                      </Button>
                                      <Button size="sm" onClick={() => { setOpenAddTaskForProject(p.id); setNewTask({ ...newTask, project_id: p.id }); }}>
                                        + Task
                                      </Button>
                                      <Button size="sm" onClick={() => { setOpenAddMilestoneForProject(p.id); setNewMilestone({ ...newMilestone, project_id: p.id }); }}>
                                        + Milestone
                                      </Button>
                                    </div>
                                  </div>

                                  {/* inline resources for task */}
                                  <div className="ml-6 mt-2 text-sm">
                                    <div className="font-medium">Resources</div>
                                    {(resourcesByTask.get(t.id) || []).length === 0 ? (
                                      <div className="text-xs text-muted-foreground">No resources assigned</div>
                                    ) : (
                                      <ul className="list-disc pl-5">
                                        {(resourcesByTask.get(t.id) || []).map((r) => (
                                          <li key={r.id}>
                                            {r.name} — {r.type} — {formatCurrency(Number(r.cost))}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold">Milestones</h4>
                          {pMilestones.length === 0 ? (
                            <div className="text-xs text-muted-foreground">No milestones</div>
                          ) : (
                            <ul className="list-disc pl-5">
                              {pMilestones.map((m) => (
                                <li key={m.id}>
                                  {m.name} — due {m.due_date}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Task Dependencies</h2>
                <Card>
                  <CardContent>
                    <p className="text-sm mb-2">Create a dependency (Task A depends on Task B)</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <SelectWrapper
                        label="Dependent Task (A)"
                        items={tasks || []}
                        valueKey="id"
                        labelKey="name"
                        onChange={(val) => setNewTask((s) => ({ ...s, dependency_id: val || null }))}
                        placeholder="Select task A"
                      />
                      <div className="flex items-end">
                        <Button
                          onClick={() => {
                            if (!newTask.dependency_id || !newTask.project_id) {
                              alert("Set task/project context first (open Add Task in project to set project_id). Or create tasks then use the Assign resources / dependency interface.");
                              return;
                            }
                            // create a dependency record (task_dependencies has task_id and depends_on)
                            createTaskDependency.mutate({
                              task_id: newTask.project_id, // NOTE: user must set correctly via UI (we provide a better route below)
                              depends_on: newTask.dependency_id,
                            } as TaskDependency);
                          }}
                        >
                          Save dependency
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-semibold">Existing dependencies</h4>
                      <ul className="list-disc pl-5">
                        {(taskDependencies || []).map((td: TaskDependency, idx: number) => {
                          const a = (tasks || []).find((t) => t.id === td.task_id);
                          const b = (tasks || []).find((t) => t.id === td.depends_on);
                          return (
                            <li key={idx}>
                              {a ? a.name : td.task_id} depends on {b ? b.name : td.depends_on}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-4">
                  <h2 className="text-lg font-semibold mb-2">Create quick items</h2>
                  <Card>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <Label>Quick Task Name</Label>
                          <Input placeholder="Task name" value={newTask.name ?? ""} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} />
                        </div>
                        <div>
                          <Label>For project (choose)</Label>
                          <SelectWrapper label="Project" items={projects || []} valueKey="id" labelKey="name" onChange={(val) => setNewTask({ ...newTask, project_id: val ?? "" })} placeholder="Select project" />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => createTask.mutate(newTask)}>Save Task</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ---------------- RESOURCE ALLOCATION ---------------- */}
          <TabsContent value="resources">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold mb-2">Resources</h3>
                <Card>
                  <CardContent>
                    <div className="space-y-2">
                      {(resources || []).map((r) => (
                        <div key={r.id} className="flex justify-between items-center mb-2">
                          <div>
                            <div className="font-medium">{r.name}</div>
                            <div className="text-xs text-muted-foreground">{r.type} — {formatCurrency(Number(r.cost))}</div>
                          </div>
                          <div>
                            <Button size="sm" onClick={() => { setOpenAssignResourceToTask(null); setAssignResource({ task_id: "", resource_id: r.id }); setOpenAssignResourceToTask(""); }}>
                              Assign
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div className="mt-4">
                        <Button onClick={() => setOpenAddResource(true)}><Plus className="mr-2 h-4 w-4" /> New Resource</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Assign Resources to Tasks</h3>
                <Card>
                  <CardContent>
                    <div className="grid gap-2">
                      <SelectWrapper label="Task" items={tasks || []} valueKey="id" labelKey="name" onChange={(val) => setAssignResource((s) => ({ ...s, task_id: val ?? "" }))} />
                      <SelectWrapper label="Resource" items={resources || []} valueKey="id" labelKey="name" onChange={(val) => setAssignResource((s) => ({ ...s, resource_id: val ?? "" }))} />
                      <div>
                        <Button onClick={() => {
                          if (!assignResource.task_id || !assignResource.resource_id) {
                            alert("Select both task and resource");
                            return;
                          }
                          assignResourceToTask.mutate(assignResource);
                        }}>
                          Assign Resource
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ---------------- BUDGETING & COST TRACKING ---------------- */}
          <TabsContent value="budget">
            <div className="space-y-4">
              {projects?.map((p) => {
                const totals = budgetTotalsByProject.get(p.id) ?? { allocated: 0, planned: 0, actual: 0 };
                const remaining = Number(totals.allocated) - Number(totals.actual);
                return (
                  <Card key={p.id}>
                    <CardHeader>
                      <CardTitle>{p.name} — Budget</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Allocated</div>
                          <div className="font-medium">{formatCurrency(totals.allocated)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Planned (sum)</div>
                          <div className="font-medium">{formatCurrency(totals.planned)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Actual (sum)</div>
                          <div className="font-medium">{formatCurrency(totals.actual)}</div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Input type="number" placeholder="Add allocation amount" onChange={(e) => setNewProjectBudget({ project_id: p.id, amount: Number(e.target.value) })} />
                        <Button onClick={() => createProjectBudget.mutate({ project_id: p.id, amount: Number(newProjectBudget.amount) })}>Allocate</Button>

                        <Input type="number" placeholder="Add budget item planned amount" onChange={(e) => setNewBudgetItem({ project_id: p.id, planned_amount: Number(e.target.value), actual_amount: 0 })} />
                        <Button onClick={() => createBudgetItem.mutate({ project_id: p.id, planned_amount: Number(newBudgetItem.planned_amount), actual_amount: Number(newBudgetItem.actual_amount) })}>Add Budget Item</Button>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-semibold">Budget Items</h4>
                        <ul className="list-disc pl-5">
                          {(budgets || []).filter((b) => b.project_id === p.id).map((b) => (
                            <li key={b.id}>
                              Planned: {formatCurrency(Number(b.planned_amount))} — Actual: {formatCurrency(Number(b.actual_amount))}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs text-muted-foreground">Remaining (allocated - actual)</div>
                        <div className="font-medium">{formatCurrency(remaining)}</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ---------------- PROGRESS & REPORTS ---------------- */}
          <TabsContent value="reports">
            <div className="space-y-4">
              {projects?.map((p) => {
                const pTasks = tasksByProject.get(p.id) ?? [];
                const completed = pTasks.filter((t) => t.status === "completed").length;
                const total = pTasks.length;
                const completionRate = total ? Math.round((completed / total) * 100) : 0;

                const overdueTasks = pTasks.filter((t) => {
                  if (!t.end_date) return false;
                  const end = new Date(t.end_date);
                  return end < new Date() && t.status !== "completed";
                });

                const pMilestones = milestonesByProject.get(p.id) ?? [];
                const overdueMilestones = pMilestones.filter((m) => {
                  if (!m.due_date) return false;
                  const due = new Date(m.due_date);
                  return due < new Date();
                });

                const pAlerts = (alerts || []).filter((a: ProjectAlert) => a.project_id === p.id);

                return (
                  <Card key={p.id}>
                    <CardHeader>
                      <CardTitle>{p.name} — Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Completion</div>
                          <div className="font-medium">{completionRate}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Tasks (completed/total)</div>
                          <div className="font-medium">{completed}/{total}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Overdue Tasks</div>
                          <div className="font-medium">{overdueTasks.length}</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <h4 className="font-semibold">Overdue Tasks</h4>
                        {overdueTasks.length === 0 ? <div className="text-xs text-muted-foreground">None</div> :
                          <ul className="list-disc pl-5">{overdueTasks.map((t) => <li key={t.id}>{t.name} — due {t.end_date}</li>)}</ul>
                        }
                      </div>

                      <div className="mt-3">
                        <h4 className="font-semibold">Overdue Milestones</h4>
                        {overdueMilestones.length === 0 ? <div className="text-xs text-muted-foreground">None</div> :
                          <ul className="list-disc pl-5">{overdueMilestones.map((m) => <li key={m.id}>{m.name} — due {m.due_date}</li>)}</ul>
                        }
                      </div>

                      <div className="mt-3">
                        <h4 className="font-semibold">Alerts</h4>
                        <div className="flex gap-2 items-center">
                          <Input value={newAlertMessage} onChange={(e) => setNewAlertMessage(e.target.value)} placeholder="Write alert message" />
                          <Button onClick={() => {
                            if (!newAlertMessage) { alert("Enter a message"); return; }
                            createAlert.mutate({ project_id: p.id, message: newAlertMessage });
                          }}>Send Alert</Button>
                        </div>
                        <ul className="list-disc pl-5 mt-2">
                          {pAlerts.map((a: ProjectAlert) => <li key={a.id}>{a.message} — {new Date(a.created_at).toLocaleString()}</li>)}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* ---------------- DIALOGS ---------------- */}

        {/* Add Project */}
        <Dialog open={openAddProject} onOpenChange={setOpenAddProject}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <div>
                <Label>Name</Label>
                <Input value={newProject.name ?? ""} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newProject.description ?? ""} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={newProject.start_date ?? ""} onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={newProject.end_date ?? ""} onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAddProject(false)}>Cancel</Button>
              <Button onClick={() => createProject.mutate(newProject)}>Save Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Task */}
        <Dialog open={!!openAddTaskForProject} onOpenChange={() => setOpenAddTaskForProject(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <div>
                <Label>Task Name</Label>
                <Input value={newTask.name ?? ""} onChange={(e) => setNewTask({ ...newTask, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newTask.description ?? ""} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Input value={newTask.status ?? ""} onChange={(e) => setNewTask({ ...newTask, status: e.target.value })} placeholder="todo / in-progress / completed" />
              </div>
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={newTask.start_date ?? ""} onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })} />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={newTask.end_date ?? ""} onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })} />
              </div>
              <div>
                <Label>Dependency (optional)</Label>
                <SelectWrapper label="Depends on" items={tasks || []} valueKey="id" labelKey="name" onChange={(val) => setNewTask({ ...newTask, dependency_id: val ?? null })} placeholder="Select existing task" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAddTaskForProject(null)}>Cancel</Button>
              <Button onClick={() => createTask.mutate(newTask)}>Save Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Milestone */}
        <Dialog open={!!openAddMilestoneForProject} onOpenChange={() => setOpenAddMilestoneForProject(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Milestone</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <div>
                <Label>Name</Label>
                <Input value={newMilestone.name ?? ""} onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={newMilestone.due_date ?? ""} onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAddMilestoneForProject(null)}>Cancel</Button>
              <Button onClick={() => createMilestone.mutate(newMilestone)}>Save Milestone</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Resource */}
        <Dialog open={openAddResource} onOpenChange={setOpenAddResource}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Resource</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <div><Label>Name</Label><Input value={newResource.name ?? ""} onChange={(e) => setNewResource({ ...newResource, name: e.target.value })} /></div>
              <div><Label>Type</Label><Input value={newResource.type ?? ""} onChange={(e) => setNewResource({ ...newResource, type: e.target.value })} placeholder="human / material / financial" /></div>
              <div><Label>Cost</Label><Input type="number" value={String(newResource.cost ?? 0)} onChange={(e) => setNewResource({ ...newResource, cost: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAddResource(false)}>Cancel</Button>
              <Button onClick={() => createResource.mutate(newResource)}>Save Resource</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assign Resource */}
        <Dialog open={!!openAssignResourceToTask} onOpenChange={() => setOpenAssignResourceToTask(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Resource to Task</DialogTitle></DialogHeader>
            <div className="space-y-2">
              <SelectWrapper label="Task" items={tasks || []} valueKey="id" labelKey="name" onChange={(val) => setAssignResource((s) => ({ ...s, task_id: val ?? "" }))} />
              <SelectWrapper label="Resource" items={resources || []} valueKey="id" labelKey="name" onChange={(val) => setAssignResource((s) => ({ ...s, resource_id: val ?? "" }))} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAssignResourceToTask(null)}>Cancel</Button>
              <Button onClick={() => assignResourceToTask.mutate(assignResource)}>Assign</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ERPLayout>
  );
}

// ---------- Small helper select wrapper to reuse ----------
function SelectWrapper<T extends Record<string, string | number| null >>({
  label,
  items,
  valueKey,
  labelKey,
  onChange,
  placeholder,
}: {
  label?: string;
  items: T[];
  valueKey: keyof T;
  labelKey: keyof T;
  onChange: (val: string | null) => void;
  placeholder?: string;
}) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <Select onValueChange={(val) => onChange(val || null)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder ?? "Select..."} />
        </SelectTrigger>
        <SelectContent>
          {items.map((it) => (
            <SelectItem key={String(it[valueKey])} value={String(it[valueKey])}>
              {String(it[labelKey])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
