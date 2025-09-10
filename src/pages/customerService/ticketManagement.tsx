
// src/pages/customerService/ticketManagement.tsx

import React, { useState } from 'react';
import { useTickets } from './hooks/useTickets';
import TicketList from './components/TicketList';
import TicketDetails from './components/TicketDetails';
import TicketForm from './components/TicketForm';
import TicketNotes from './components/TicketNotes';
import { Ticket, InternalNote } from './types';

const TicketManagementPage: React.FC = () => {
  const { tickets, loading, error, setTickets } = useTickets();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowForm(false);
  };

  const handleCreateTicket = (ticketData: Partial<Ticket>) => {
    // TODO: replace with API call to create ticket
    const newTicket: Ticket = {
      ...ticketData,
      id: Math.random().toString(36).substr(2, 9),
      status: ticketData.status || 'Open',
      priority: ticketData.priority || 'Medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerId: 'cust-temp', // replace with real customer ID
      internalNotes: [],
      assignedTo: undefined,
    } as Ticket;

    setTickets([newTicket, ...tickets]);
    setSelectedTicket(newTicket);
    setShowForm(false);
  };

  const handleAddNote = (noteText: string) => {
    if (!selectedTicket) return;
    const newNote: InternalNote = {
      id: Math.random().toString(36).substr(2, 9),
      ticketId: selectedTicket.id,
      author: 'Support Agent', // replace with logged-in user
      note: noteText,
      createdAt: new Date().toISOString(),
    };
    const updatedTicket = {
      ...selectedTicket,
      internalNotes: [...(selectedTicket.internalNotes || []), newNote],
      updatedAt: new Date().toISOString(),
    };
    setSelectedTicket(updatedTicket);
    setTickets(
      tickets.map((t) => (t.id === updatedTicket.id ? updatedTicket : t))
    );
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
