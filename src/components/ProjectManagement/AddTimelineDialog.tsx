import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Task {
  name: string;
  price: number;
}

interface TaskSchedule {
  taskName: string;
  startDate: string;
  endDate: string;
}

interface AddTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddTimelineDialog = ({ open, onOpenChange }: AddTimelineDialogProps) => {
  const [projectId, setProjectId] = useState("");
  const [taskSchedules, setTaskSchedules] = useState<TaskSchedule[]>([]);
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, project_code, project_name")
        .order("project_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: projectTasks } = useQuery({
    queryKey: ["project_tasks", projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select("tasks")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return [];
      return (data.tasks as any as Task[]) || [];
    },
  });

  // Initialize task schedules when project tasks are loaded
  const handleProjectChange = (newProjectId: string) => {
    setProjectId(newProjectId);
    setTaskSchedules([]);
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const estimatedEnd = taskSchedules.length > 0
        ? taskSchedules.reduce((latest, schedule) => {
            const endDate = new Date(schedule.endDate);
            return endDate > latest ? endDate : latest;
          }, new Date(taskSchedules[0].endDate))
        : null;

      const { error } = await supabase.from("project_timelines").insert([{
        timeline_code: "",
        project_id: projectId,
        task_schedules: taskSchedules as any,
        estimated_end: estimatedEnd ? format(estimatedEnd, "yyyy-MM-dd") : null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_timelines"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Timeline added successfully");
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add timeline");
    },
  });

  const resetForm = () => {
    setProjectId("");
    setTaskSchedules([]);
  };

  const handleTaskScheduleChange = (
    taskName: string,
    field: "startDate" | "endDate",
    date: Date | undefined
  ) => {
    if (!date) return;
    const newSchedules = [...taskSchedules];
    const existingIndex = newSchedules.findIndex((s) => s.taskName === taskName);
    
    if (existingIndex >= 0) {
      newSchedules[existingIndex] = {
        ...newSchedules[existingIndex],
        [field]: format(date, "yyyy-MM-dd"),
      };
    } else {
      newSchedules.push({
        taskName,
        startDate: field === "startDate" ? format(date, "yyyy-MM-dd") : "",
        endDate: field === "endDate" ? format(date, "yyyy-MM-dd") : "",
      });
    }
    setTaskSchedules(newSchedules);
  };

  const getScheduleForTask = (taskName: string) => {
    return taskSchedules.find((s) => s.taskName === taskName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }
    if (!projectTasks || projectTasks.length === 0) {
      toast.error("This project has no tasks defined");
      return;
    }
    if (taskSchedules.length !== projectTasks.length) {
      toast.error("Please set deadlines for all tasks");
      return;
    }
    if (taskSchedules.some((s) => !s.startDate || !s.endDate)) {
      toast.error("Please fill in all start and end dates");
      return;
    }
    addMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Deadline</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_code} - {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {projectId && projectTasks && projectTasks.length > 0 ? (
            <div className="space-y-3">
              <Label>Task Schedules *</Label>
              {projectTasks.map((task, index) => {
                const schedule = getScheduleForTask(task.name);
                return (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="font-medium text-sm">{task.name}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !schedule?.startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {schedule?.startDate
                                ? format(new Date(schedule.startDate), "PPP")
                                : "Pick start date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                schedule?.startDate
                                  ? new Date(schedule.startDate)
                                  : undefined
                              }
                              onSelect={(date) =>
                                handleTaskScheduleChange(task.name, "startDate", date)
                              }
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !schedule?.endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {schedule?.endDate
                                ? format(new Date(schedule.endDate), "PPP")
                                : "Pick end date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={
                                schedule?.endDate
                                  ? new Date(schedule.endDate)
                                  : undefined
                              }
                              onSelect={(date) =>
                                handleTaskScheduleChange(task.name, "endDate", date)
                              }
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : projectId ? (
            <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
              This project has no tasks defined yet. Please add tasks first.
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Adding..." : "Set Deadline"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};