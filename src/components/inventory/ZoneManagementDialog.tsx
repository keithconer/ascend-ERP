// ZoneManagementDialog.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ZoneManagementDialog({ open, onOpenChange, warehouseId }) {
  const queryClient = useQueryClient();
  const [zoneName, setZoneName] = useState("");

  // Fetch zones for this warehouse
  const { data: zones, isLoading } = useQuery({
    queryKey: ["zones", warehouseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("id, name")
        .eq("warehouse_id", warehouseId);

      if (error) throw error;
      return data;
    },
    enabled: !!warehouseId && open, // only run when dialog is open
  });

  // Add zone mutation
  const addZone = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from("zones")
        .insert({ name, warehouse_id: warehouseId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones", warehouseId] });
      setZoneName("");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Zones</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p>Loading zones...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {zones?.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>{zone.id}</TableCell>
                  <TableCell>{zone.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogFooter className="flex items-center gap-2">
          <Input
            placeholder="New zone name"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
          />
          <Button
            onClick={() => addZone.mutate(zoneName)}
            disabled={!zoneName.trim() || addZone.isLoading}
          >
            Add Zone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
