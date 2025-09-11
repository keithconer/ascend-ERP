
// src/pages/customerService/ticketManagement.tsx

import React, { useState } from 'react';
import { useTickets } from './hooks/useTickets';
import { createTicket, addInternalNote } from '@/lib/customerService/tickets';
import TicketList from './components/TicketList';
import TicketDetails from './components/TicketDetails';
import TicketForm from './components/TicketForm';
import TicketNotes from './components/TicketNotes';
import { Ticket, InternalNote } from './types';
import { useToast } from '@/hooks/use-toast';

const TicketManagementPage: React.FC = () => {
  const { tickets, loading, error, setTickets, refetch } = useTickets();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowForm(false);
  };

  const handleCreateTicket = async (ticketData: Partial<Ticket>) => {
    try {
      await createTicket(ticketData);
      await refetch();
      setShowForm(false);
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async (noteText: string) => {
    if (!selectedTicket) return;
    
    try {
      await addInternalNote(selectedTicket.id, noteText);
      
      // Refetch tickets and update selected ticket
      await refetch();
      
      // We need to wait for the state to update, so let's use a timeout
      // or better yet, fetch the specific ticket with notes
      const { getTicketWithNotes } = await import('@/lib/customerService/tickets');
      const updatedTicket = await getTicketWithNotes(selectedTicket.id);
      
      // Convert the database response to our Ticket type
      const ticketWithNotes: Ticket = {
        id: updatedTicket.id,
        title: updatedTicket.title,
        description: updatedTicket.description || '',
        status: updatedTicket.status as Ticket['status'],
        priority: updatedTicket.priority as Ticket['priority'],
        createdAt: updatedTicket.created_at,
        updatedAt: updatedTicket.updated_at || updatedTicket.created_at,
        customerId: 'customer',
        assignedTo: updatedTicket.assigned_to,
        internalNotes: updatedTicket.internal_notes?.map((note: any) => ({
          id: note.id,
          ticketId: note.ticket_id,
          author: note.created_by || 'Unknown',
          note: note.note,
          createdAt: note.created_at
        })) || []
      };
      
      setSelectedTicket(ticketWithNotes);
      
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    }
  };

  if (loading) return <p>Loading tickets...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="p-6 flex gap-6 bg-gray-50 min-h-screen">
      <div className="w-1/3">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tickets</h1>
          <button
            onClick={() => {
              setSelectedTicket(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            New Ticket
          </button>
        </div>
        <TicketList tickets={tickets} onSelectTicket={handleSelectTicket} />
      </div>
      <div className="w-2/3 space-y-4">
        {showForm ? (
          <TicketForm onSubmit={handleCreateTicket} />
        ) : selectedTicket ? (
          <>
            <TicketDetails ticket={selectedTicket} />
            <TicketNotes
              notes={selectedTicket.internalNotes}
              onAddNote={handleAddNote}
            />
          </>
        ) : (
          <p>Select a ticket or create a new one.</p>
        )}
      </div>
    </div>
  );
};

export default TicketManagementPage;
