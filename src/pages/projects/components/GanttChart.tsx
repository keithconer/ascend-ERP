// src/pages/projects/components/GanttChart.tsx
import React from "react";
import { Gantt, Task } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Tables } from "@/integrations/supabase/project_types";

type DbTask = Tables<"tasks">;
type TaskDependency = Tables<"task_dependencies">;

interface GanttChartProps {
  tasks: DbTask[];
  dependencies: TaskDependency[];
}

export default function GanttChart({ tasks, dependencies }: GanttChartProps) {
  const ganttTasks: Task[] = tasks.map((t) => ({
    id: t.id,
    name: t.name,
    start: new Date(t.start_date ?? ""),
    end: new Date(t.end_date ?? ""),
    type: "task",
    progress: 0,
    isDisabled: false,
    dependencies: dependencies
      .filter((d) => d.task_id === t.id)
      .map((d) => d.depends_on_task_id),
  }));

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Gantt Chart</h3>
      <Gantt tasks={ganttTasks} />
    </div>
  );
}
