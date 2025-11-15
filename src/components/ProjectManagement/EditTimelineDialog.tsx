import { useState, useEffect } from "react";
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

interface TaskSchedule {
  taskName: string;
  startDate: string;
  endDate: string;
}

interface Timeline {
  id: string;
  timeline_code: string;
  project_id: string;
  task_schedules: TaskSchedule[];
  estimated_end: string | null;
}

interface EditTimelineDialogProps {
  timeline: Timeline;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTimelineDialog = ({ timeline, open, onOpenChange }: EditTimelineDialogProps) => {
  const [projectId, setProjectId] = useState(timeline.project_id);
  const [taskSchedules, setTaskSchedules] = useState<TaskSchedule[]>(timeline.task_schedules);
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

  useEffect(() => {
    setProjectId(timeline.project_id);
    setTaskSchedules(timeline.task_schedules);
  }, [timeline]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const estimatedEnd = taskSchedules.length > 0
        ? taskSchedules.reduce((latest, schedule) => {
            const endDate = new Date(schedule.endDate);
            return endDate > latest ? endDate : latest;
          }, new Date(taskSchedules[0].endDate))
        : null;

      const { error } = await supabase
        .from("project_timelines")
        .update({
          project_id: projectId,
          task_schedules: taskSchedules as any,
          estimated_end: estimatedEnd ? format(estimatedEnd, "yyyy-MM-dd") : null,
        })
        .eq("id", timeline.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_timelines"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Timeline updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update timeline");
    },
  });

  const handleTaskScheduleChange = (
    index: number,
    field: "startDate" | "endDate",
    date: Date | undefined
  ) => {
    if (!date) return;
    const newSchedules = [...taskSchedules];
    newSchedules[index] = {
      ...newSchedules[index],
      [field]: format(date, "yyyy-MM-dd"),
    };
    setTaskSchedules(newSchedules);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }
    if (taskSchedules.some((s) => !s.startDate || !s.endDate)) {
      toast.error("Please fill in all start and end dates");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Timeline</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Timeline Code</Label>
            <Input value={timeline.timeline_code} disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
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

          <div className="space-y-3">
            <Label>Task Schedules *</Label>
            {taskSchedules.map((schedule, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="font-medium text-sm">{schedule.taskName}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !schedule.startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {schedule.startDate
                            ? format(new Date(schedule.startDate), "PPP")
                            : "Pick start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            schedule.startDate
                              ? new Date(schedule.startDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            handleTaskScheduleChange(index, "startDate", date)
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
                            !schedule.endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {schedule.endDate
                            ? format(new Date(schedule.endDate), "PPP")
                            : "Pick end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={
                            schedule.endDate
                              ? new Date(schedule.endDate)
                              : undefined
                          }
                          onSelect={(date) =>
                            handleTaskScheduleChange(index, "endDate", date)
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Timeline"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};