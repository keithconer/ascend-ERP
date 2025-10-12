import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DeleteTicket({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();

  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("customer_tickets")
        .delete()
        .eq("ticket_id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["customer_tickets"] });
      queryClient.invalidateQueries({ queryKey: ["customer_issues"] });
      queryClient.invalidateQueries({ queryKey: ["customer_solutions"] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete ticket: ${error.message}`);
    },
  });

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => deleteTicketMutation.mutate()}
      disabled={deleteTicketMutation.isPending}
    >
      {deleteTicketMutation.isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
