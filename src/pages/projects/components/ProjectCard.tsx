import React from "react";
import { Tables, TablesInsert } from "@/integrations/supabase/project_types";
import { Button } from "@/components/ui/button";

type Project = Tables<"projects">;
type Phase = Tables<"project_phases">;
type Task = Tables<"tasks">;

interface ProjectCardProps {
  project: Project;
  phases: Phase[];
  tasks: Task[];
  dependencies: { task_id: string; depends_on_task_id: string }[];
  onAddPhase: (projectId: string) => void;
  onAddTask: (phaseId: string) => void;
  onAssignResources: (taskId: string) => void; // NEW
}

export default function ProjectCard({
  project,
  phases,
  tasks,
  dependencies,
  onAddPhase,
  onAddTask,
  onAssignResources,
}: ProjectCardProps) {
  return (
    <div className="border p-4 rounded-md shadow-sm space-y-4">
      <h2 className="text-xl font-semibold">{project.name}</h2>
      <p className="text-muted-foreground">{project.description}</p>

      {/* Phases */}
      {phases
        .filter((ph) => ph.project_id === project.id)
        .map((phase) => (
          <div key={phase.id} className="border p-2 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{phase.name}</h3>
              <Button size="sm" onClick={() => onAddTask(phase.id)}>
                + Task
              </Button>
            </div>
            <p className="text-sm">{phase.description}</p>

            {/* Tasks */}
            {tasks
              .filter((t) => t.phase_id === phase.id)
              .map((task) => (
                <div
                  key={task.id}
                  className="flex justify-between items-center border p-1 rounded-md"
                >
                  <div>
                    <p className="font-medium">{task.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.start_date} → {task.end_date} | {task.status}
                    </p>
                  </div>
                  {/* Assign Resources Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAssignResources(task.id!)}
                  >
                    Assign Resources
                  </Button>
                </div>
              ))}
          </div>
        ))}

      <Button onClick={() => onAddPhase(project.id)}>+ Phase</Button>
    </div>
  );
}
