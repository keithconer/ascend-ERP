'use client';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

import type { Database } from '@/integrations/supabase/types';

type TicketRow = Database['public']['Tables']['customer_tickets']['Row'] & {
  ticket_id: string;
};

type DeleteTicketProps = {
  ticket: TicketRow;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteTicket({ ticket, onClose, onDeleted }: DeleteTicketProps) {
  async function onDelete() {
    try {
      const { error } = await supabase.from('customer_tickets').delete().eq('id', ticket.id);
      if (error) throw error;
      toast.success(`Ticket ${ticket.ticket_id} deleted`);
      onDeleted();
    } catch (error: any) {
      toast.error(`Failed to delete ticket: ${error.message}`);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-md max-w-sm w-full">
        <h3 className="text-lg font-semibold mb-4">Delete Ticket</h3>
        <p>
          Are you sure you want to delete ticket <strong>{ticket.ticket_id}</strong>? This action
          cannot be undone.
        </p>

        <div className="mt-6 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
