import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { format, differenceInDays, eachDayOfInterval } from "date-fns";
  
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
    project?: {
      project_name: string;
      project_code: string;
    };
  }
  
  interface ViewTimelineDialogProps {
    timeline: Timeline;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }
  
  export const ViewTimelineDialog = ({ timeline, open, onOpenChange }: ViewTimelineDialogProps) => {
    // Get overall project date range
    const getProjectDateRange = () => {
      if (timeline.task_schedules.length === 0) return { start: new Date(), end: new Date() };
      
      const allDates = timeline.task_schedules.flatMap((task) => [
        new Date(task.startDate),
        new Date(task.endDate),
      ]);
      
      return {
        start: new Date(Math.min(...allDates.map((d) => d.getTime()))),
        end: new Date(Math.max(...allDates.map((d) => d.getTime()))),
      };
    };
  
    const { start: projectStart, end: projectEnd } = getProjectDateRange();
    const projectDays = eachDayOfInterval({ start: projectStart, end: projectEnd });
    const totalDays = projectDays.length;
  
    // Calculate position and width for each task
    const getTaskPosition = (task: TaskSchedule) => {
      const taskStart = new Date(task.startDate);
      const taskEnd = new Date(task.endDate);
      
      const startOffset = differenceInDays(taskStart, projectStart);
      const duration = differenceInDays(taskEnd, taskStart) + 1;
      
      const left = (startOffset / totalDays) * 100;
      const width = (duration / totalDays) * 100;
      
      return { left, width };
    };
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Timeline - {timeline.project?.project_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <div className="text-sm text-muted-foreground">Timeline Code</div>
                <div className="font-medium">{timeline.timeline_code}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Project Code</div>
                <div className="font-medium">{timeline.project?.project_code}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Project Start</div>
                <div className="font-medium">
                  {format(projectStart, "MMM dd, yyyy")}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Estimated End</div>
                <div className="font-medium">
                  {format(projectEnd, "MMM dd, yyyy")}
                </div>
              </div>
            </div>
  
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Task Timeline</h3>
              <div className="space-y-4">
                {timeline.task_schedules.map((task, index) => {
                  const { left, width } = getTaskPosition(task);
                  const duration = differenceInDays(
                    new Date(task.endDate),
                    new Date(task.startDate)
                  ) + 1;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium">{task.taskName}</div>
                        <div className="text-muted-foreground">
                          {format(new Date(task.startDate), "MMM dd")} -{" "}
                          {format(new Date(task.endDate), "MMM dd")} ({duration} days)
                        </div>
                      </div>
                      <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute h-full bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                        >
                          {width > 10 && `${duration}d`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
  
            {/* GitHub-style activity visualization */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Activity Overview</h3>
              <div className="flex flex-wrap gap-1">
                {projectDays.map((day, index) => {
                  const hasActivity = timeline.task_schedules.some((task) => {
                    const taskStart = new Date(task.startDate);
                    const taskEnd = new Date(task.endDate);
                    return day >= taskStart && day <= taskEnd;
                  });
                  
                  return (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-sm ${
                        hasActivity ? "bg-primary" : "bg-muted"
                      }`}
                      title={format(day, "MMM dd, yyyy")}
                    />
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-muted" />
                  <span>No activity</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-primary" />
                  <span>Active task</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };