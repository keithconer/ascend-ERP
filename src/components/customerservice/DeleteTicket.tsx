import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteTicketProps {
  ticketId: string;
  ticketDisplayId: string;
}

export default function DeleteTicket({ ticketId, ticketDisplayId }: DeleteTicketProps) {
  const queryClient = useQueryClient();

  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      // Delete ticket (cascade will handle issues and solutions)
      const { error } = await supabase
        .from("customer_tickets")
        .delete()
        .eq("ticket_id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket and related records deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["customer_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["customer_issues"] });
      queryClient.invalidateQueries({ queryKey: ["customer_solutions"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete ticket: ${error.message}`);
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete ticket {ticketDisplayId}? This will
            also delete all related issues and solutions. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteTicketMutation.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteTicketMutation.isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
