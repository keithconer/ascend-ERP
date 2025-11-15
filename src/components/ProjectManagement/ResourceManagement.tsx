import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash } from "lucide-react";
import { AddResourceDialog } from "./AddResourceDialog";
import { EditResourceDialog } from "./EditResourceDialog";

interface Equipment {
  name: string;
  price: number;
}

interface Resource {
  id: string;
  resource_code: string;
  project_id: string;
  equipments: Equipment[];
  total_resources: number;
  project?: {
    project_name: string;
    project_code: string;
  };
}

export const ResourceManagement = () => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const queryClient = useQueryClient();

  const { data: resources, isLoading } = useQuery({
    queryKey: ["project_resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_resources")
        .select(`
          *,
          project:projects(project_name, project_code)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any as Resource[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_resources")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_resources"] });
      toast.success("Resource deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete resource");
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resource Management</h2>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Manage Resource
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource Code</TableHead>
              <TableHead>Project Code</TableHead>
              <TableHead>Project Name</TableHead>
              <TableHead>Equipments</TableHead>
              <TableHead>Total Resources</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : resources?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No resources found
                </TableCell>
              </TableRow>
            ) : (
              resources?.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">
                    {resource.resource_code}
                  </TableCell>
                  <TableCell>{resource.project?.project_code || "-"}</TableCell>
                  <TableCell>{resource.project?.project_name || "-"}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {resource.equipments.map((eq, idx) => (
                        <div key={idx} className="text-sm">
                          {eq.name} - {formatCurrency(eq.price)}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(resource.total_resources)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditResource(resource)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(resource.id)}
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

      <AddResourceDialog open={isAddOpen} onOpenChange={setIsAddOpen} />
      {editResource && (
        <EditResourceDialog
          resource={editResource}
          open={!!editResource}
          onOpenChange={(open) => !open && setEditResource(null)}
        />
      )}
    </div>
  );
};