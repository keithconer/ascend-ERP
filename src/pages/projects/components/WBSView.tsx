import React from "react";
import { Tables } from "@/integrations/supabase/project_types";

type Phase = Tables<"project_phases">;
type Task = Tables<"tasks">;
type Dependency = Tables<"task_dependencies">;

interface WBSViewProps {
  phases: Phase[];
  tasks: Task[];
  dependencies: Dependency[]; // pass task dependencies
}

export default function WBSView({ phases, tasks, dependencies }: WBSViewProps) {
  return (
    <div className="space-y-4 border rounded p-4 bg-white shadow-sm">
      <h2 className="text-xl font-semibold mb-2">Work Breakdown Structure (WBS)</h2>

      {phases.map((phase) => {
        const phaseTasks = tasks.filter((t) => t.phase_id === phase.id);

        // Phase duration in days
        const phaseStart = phase.start_date ? new Date(phase.start_date) : null;
        const phaseEnd = phase.end_date ? new Date(phase.end_date) : null;
        const phaseDuration =
          phaseStart && phaseEnd
            ? (phaseEnd.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24)
            : 1;

        return (
          <div key={phase.id} className="border rounded p-3 bg-gray-50">
            <h3 className="font-medium text-lg">{phase.name}</h3>
            {phaseTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks added yet</p>
            ) : (
              <div className="space-y-2 mt-2">
                {phaseTasks.map((task) => {
                  const taskStart = task.start_date ? new Date(task.start_date) : null;
                  const taskEnd = task.end_date ? new Date(task.end_date) : null;

                  const taskDurationPercent =
                    phaseStart && taskStart && taskEnd
                      ? ((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24 / phaseDuration)) * 100
                      : 0;

                  const taskOffsetPercent =
                    phaseStart && taskStart
                      ? ((taskStart.getTime() - phaseStart.getTime()) / (1000 * 60 * 60 * 24 / phaseDuration)) * 100
                      : 0;

                  // Get tasks this one depends on
                  const dependsOn = dependencies
                    ?.filter((d) => d.task_id === task.id)
                    ?.map((d) => tasks.find((t) => t.id === d.depends_on_task_id)?.name)
                    .filter(Boolean);

                  return (
                    <div key={task.id}>
                      <div className="flex justify-between mb-1">
                        <span>{task.name}</span>
                        <span className="text-sm text-gray-500">
                          {task.start_date} - {task.end_date}
                        </span>
                      </div>

                      <div className="relative h-4 bg-gray-200 rounded mb-1">
                        <div
                          className={`absolute h-4 rounded`}
                          style={{
                            left: `${taskOffsetPercent}%`,
                            width: `${taskDurationPercent}%`,
                            backgroundColor:
                              task.status === "completed"
                                ? "#34D399"
                                : task.status === "in-progress"
                                ? "#FBBF24"
                                : "#60A5FA",
                          }}
                        ></div>
                      </div>

                      {dependsOn && dependsOn.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Depends on: {dependsOn.join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
