/* ======================  GANTT CHART  ====================== */
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash, Eye, Search } from "lucide-react";
import { AddTimelineDialog } from "./AddTimelineDialog";
import { EditTimelineDialog } from "./EditTimelineDialog";
import { ViewTimelineDialog } from "./ViewTimelineDialog";

interface TaskSchedule { taskName: string; startDate: string; endDate: string; }
interface Timeline {
  id: string;
  timeline_code: string;
  project_id: string;
  task_schedules: TaskSchedule[];
  estimated_end: string | null;
  project?: { project_name: string; project_code: string };
}

export const GanttChart = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTimeline, setEditTimeline] = useState<Timeline | null>(null);
  const [viewTimeline, setViewTimeline] = useState<Timeline | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: timelines, isLoading } = useQuery({
    queryKey: ["project_timelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_timelines")
        .select(`
          *,
          project:projects(project_name, project_code)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any as Timeline[];
    },
  });

  const filteredTimelines = useMemo(() => {
    if (!searchTerm) return timelines ?? [];
    const lower = searchTerm.toLowerCase();
    return (
      timelines?.filter(
        (t) =>
          t.timeline_code.toLowerCase().includes(lower) ||
          (t.project?.project_name ?? "").toLowerCase().includes(lower)
      ) ?? []
    );
  }, [timelines, searchTerm]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_timelines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_timelines"] });
      toast.success("Timeline deleted successfully");
    },
    onError: () => toast.error("Failed to delete timeline"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gantt Chart</h2>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Set Deadline
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by timeline code or project name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timeline Code</TableHead>
              <TableHead>Project Code</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Total Tasks</TableHead>
              <TableHead>Estimated End</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredTimelines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No timelines found</TableCell>
              </TableRow>
            ) : (
              filteredTimelines.map((timeline) => (
                <TableRow key={timeline.id}>
                  <TableCell className="font-medium">{timeline.timeline_code}</TableCell>
                  <TableCell>{timeline.project?.project_code || "-"}</TableCell>
                  <TableCell>{timeline.project?.project_name || "-"}</TableCell>
                  <TableCell>{timeline.task_schedules.length} tasks</TableCell>
                  <TableCell>
                    {timeline.estimated_end
                      ? new Date(timeline.estimated_end).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewTimeline(timeline)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditTimeline(timeline)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(timeline.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddTimelineDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      {editTimeline && (
        <EditTimelineDialog
          timeline={editTimeline}
          open={!!editTimeline}
          onOpenChange={(open) => !open && setEditTimeline(null)}
        />
      )}
      {viewTimeline && (
        <ViewTimelineDialog
          timeline={viewTimeline}
          open={!!viewTimeline}
          onOpenChange={(open) => !open && setViewTimeline(null)}
        />
      )}
    </div>
  );
};