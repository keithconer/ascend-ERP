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
import { toast } from "sonner";
import { X, Plus } from "lucide-react";

interface Equipment {
  name: string;
  quantity: number;
  price: number;
}

interface Resource {
  id: string;
  resource_code: string;
  project_id: string;
  equipments: Equipment[];
  total_resources: number;
}

interface EditResourceDialogProps {
  resource: Resource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditResourceDialog = ({
  resource,
  open,
  onOpenChange,
}: EditResourceDialogProps) => {
  const [projectId, setProjectId] = useState(resource.project_id);
  const [equipments, setEquipments] = useState<Equipment[]>(resource.equipments);
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
    setProjectId(resource.project_id);
    setEquipments(resource.equipments);
  }, [resource]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const total = equipments.reduce((sum, eq) => sum + ((eq.quantity || 0) * (eq.price || 0)), 0);
      const { error } = await supabase
        .from("project_resources")
        .update({
          project_id: projectId,
          equipments: equipments as any,
          total_resources: total,
        })
        .eq("id", resource.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_resources"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Resource updated successfully");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update resource");
    },
  });

  const handleAddEquipment = () => {
    setEquipments([...equipments, { name: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipments(equipments.filter((_, i) => i !== index));
  };

  const handleEquipmentChange = (
    index: number,
    field: keyof Equipment,
    value: string | number
  ) => {
    const newEquipments = [...equipments];
    newEquipments[index] = { ...newEquipments[index], [field]: value };
    setEquipments(newEquipments);
  };

  const totalResources = equipments.reduce(
    (sum, eq) => sum + ((Number(eq.quantity) || 0) * (Number(eq.price) || 0)),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      toast.error("Please select a project");
      return;
    }
    if (equipments.some((eq) => !eq.name || !eq.quantity || !eq.price)) {
      toast.error("Please fill in all equipment fields");
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Resource Code</Label>
            <Input value={resource.resource_code} disabled />
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

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Project Equipments *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEquipment}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Equipment
              </Button>
            </div>
            <div className="space-y-3">
              {equipments.map((equipment, index) => (
                <div
                  key={index}
                  className="flex gap-2 items-start p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <Input
                      placeholder="Equipment name"
                      value={equipment.name}
                      onChange={(e) =>
                        handleEquipmentChange(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={equipment.quantity || ""}
                      onChange={(e) =>
                        handleEquipmentChange(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Price (₱)"
                      value={equipment.price || ""}
                      onChange={(e) =>
                        handleEquipmentChange(
                          index,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  {equipments.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEquipment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Resources:</span>
              <span className="text-lg font-bold">
                ₱{totalResources.toLocaleString()}
              </span>
            </div>
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
              {updateMutation.isPending ? "Updating..." : "Update Resource"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};