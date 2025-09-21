import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseProject } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/project_types";

import { ERPLayout } from "@/components/erp/ERPLayout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import ProjectCard from "./components/ProjectCard";
import ProjectDialog from "./components/ProjectDialog";
import PhaseDialog from "./components/PhaseDialog";
import TaskDialog from "./components/TaskDialog";
import WBSView from "./components/WBSView";
import ResourceAssignmentDialog from "./components/ResourceAssignmentDialog";

type Project = Tables<"projects">;
type NewProject = TablesInsert<"projects">;

type Phase = Tables<"project_phases">;
type NewPhase = TablesInsert<"project_phases">;

type Task = Tables<"tasks">;
type NewTask = TablesInsert<"tasks">;

type Employee = Tables<"employees">;
type Equipment = Tables<"equipment">;

export default function ProjectManagement() {
  const qc = useQueryClient();

  // Dialog states
  const [openAddProject, setOpenAddProject] = useState(false);
  const [openAddPhaseForProject, setOpenAddPhaseForProject] = useState<string | null>(null);
  const [openAddTaskForPhase, setOpenAddTaskForPhase] = useState<string | null>(null);

  // Form states
  const [newProject, setNewProject] = useState<NewProject>({ name: "", description: "", status: "planning", start_date: null, end_date: null });
  const [newPhase, setNewPhase] = useState<NewPhase>({ project_id: "", name: "", description: "", start_date: null, end_date: null });
  const [newTask, setNewTask] = useState<NewTask>({ phase_id: "", name: "", description: "", start_date: null, end_date: null, status: "pending" });
  const [taskError, setTaskError] = useState<string | null>(null);

  // Add state for resources
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  // Resource Assignment dialog state
  const [openResourceDialogForTask, setOpenResourceDialogForTask] = useState<string | null>(null);

  // Queries
    // Projects
  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabaseProject
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
  });

    // Phases
  const { data: phases } = useQuery<Phase[]>({
    queryKey: ["project_phases"],
    queryFn: async () => {
      const { data, error } = await supabaseProject
        .from("project_phases")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as Phase[];
    },
  });

    // Tasks
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabaseProject
        .from("tasks")
        .select("*")
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });

    // Task Dependencies
  const { data: dependencies } = useQuery({
    queryKey: ["task_dependencies"],
    queryFn: async () => {
      const { data, error } = await supabaseProject
        .from("task_dependencies")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Employees
  const { data: employeesData } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("employees").select("*");
      if (error) throw error;
      return data as Employee[];
    },
  });

  // Equipment
  const { data: equipmentData } = useQuery<Equipment[]>({
    queryKey: ["equipment"],
    queryFn: async () => {
      const { data, error } = await supabaseProject.from("equipment").select("*");
      if (error) throw error;
      return data as Equipment[];
    },
  });
  
  // Mutations
  const createProject = useMutation({
    mutationFn: async (payload: NewProject) => {
      const { error } = await supabaseProject.from("projects").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setOpenAddProject(false);
      setNewProject({ name: "", description: "", status: "planning", start_date: null, end_date: null });
    },
  });

  const createPhase = useMutation({
    mutationFn: async (payload: NewPhase) => {
      const { error } = await supabaseProject.from("project_phases").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_phases"] });
      setOpenAddPhaseForProject(null);
      setNewPhase({ project_id: "", name: "", description: "", start_date: null, end_date: null });
    },
  });

  const createTask = useMutation({
    mutationFn: async (payload: NewTask) => {
      const { error } = await supabaseProject.from("tasks").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setOpenAddTaskForPhase(null);
      setNewTask({ phase_id: "", name: "", description: "", start_date: null, end_date: null, status: "pending" });
    },
  });

    const createDependency = useMutation({
    mutationFn: async (payload: { task_id: string; depends_on_task_id: string }) => {
      const { error } = await supabaseProject.from("task_dependencies").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task_dependencies"] });
    },
  });

  // Validation for tasks
  const handleSaveTask = () => {
    if (!newTask.start_date || !newTask.end_date) {
      setTaskError("Start and End dates are required.");
      return;
    }
    if (newTask.end_date < newTask.start_date) {
      setTaskError("End date cannot be earlier than start date.");
      return;
    }
    const currentPhase = phases?.find((ph) => ph.id === newTask.phase_id);
    if (currentPhase) {
      if (currentPhase.start_date && newTask.start_date < currentPhase.start_date) {
        setTaskError("Task cannot start before its phase starts.");
        return;
      }
      if (currentPhase.end_date && newTask.end_date > currentPhase.end_date) {
        setTaskError("Task cannot end after its phase ends.");
        return;
      }
    }
    setTaskError(null);

    // 1. Save Task
    createTask.mutate(newTask, {
      onSuccess: async () => {
        if (newTask.id && (newTask as any).dependencies?.length) {
          for (const depId of (newTask as any).dependencies) {
            createDependency.mutate({ task_id: newTask.id, depends_on_task_id: depId });
          }
        }
      },
    });
  };

  // Handling Resources
  const handleAssignResources = (taskId: string) => {
  setOpenResourceDialogForTask(taskId);
  };

  return (
    <ERPLayout>
      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Project Management</h1>
            <p className="text-muted-foreground">
              9.1.a — Define Timelines & Phases | 9.1.b — WBS | 9.1.c — Task Start/End Dates
            </p>
          </div>
          <Button onClick={() => setOpenAddProject(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        </div>

        {/* WBS View */}
        {phases && tasks && projects && (
          <WBSView
            phases={phases}
            tasks={tasks}
            dependencies={dependencies}
          />
        )}

        {/* Projects */}
        {loadingProjects ? (
          <p>Loading projects...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects?.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                phases={phases || []}
                tasks={tasks || []}
                dependencies={dependencies || []}
                onAddPhase={(projectId) => {
                  setOpenAddPhaseForProject(projectId);
                  setNewPhase({ ...newPhase, project_id: projectId });
                }}
                onAddTask={(phaseId) => {
                  setOpenAddTaskForPhase(phaseId);
                  setNewTask({ ...newTask, phase_id: phaseId });
                }}
                onAssignResources={handleAssignResources}
              />
            ))}
          </div>
        )}

        {openResourceDialogForTask && employeesData && equipmentData && (
          <ResourceAssignmentDialog
            open={!!openResourceDialogForTask}
            onClose={() => setOpenResourceDialogForTask(null)}
            taskId={openResourceDialogForTask}
            employees={employeesData}
            equipment={equipmentData}
            onSave={(assignment) => {
              console.log("Resource assigned:", assignment);
              // Optionally update local state or show a toast
            }}
          />
        )}

        {/* Dialogs */}
        <ProjectDialog open={openAddProject} onClose={() => setOpenAddProject(false)} project={newProject} setProject={setNewProject} onSave={() => createProject.mutate(newProject)} />
        <PhaseDialog open={!!openAddPhaseForProject} onClose={() => setOpenAddPhaseForProject(null)} phase={newPhase} setPhase={setNewPhase} onSave={() => createPhase.mutate(newPhase)} />
        <TaskDialog 
        open={!!openAddTaskForPhase}
        onClose={() => setOpenAddTaskForPhase(null)} 
        task={newTask} 
        setTask={setNewTask} 
        onSave={handleSaveTask} 
        error={taskError} 
        allTasks={tasks || []}
        />
      </div>
    </ERPLayout>
  );
}
