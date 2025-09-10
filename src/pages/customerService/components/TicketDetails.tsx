// src/pages/customerService/components/TicketDetails.tsx

import React from 'react';
import { Ticket } from '../types';
import { formatDate } from '../utils';

interface TicketDetailsProps {
  ticket: Ticket;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket }) => {
  return (
    <div className="border p-4 rounded shadow bg-white">
      <h2 className="text-xl font-bold mb-2">{ticket.title}</h2>
      <p className="mb-2"><strong>Description:</strong> {ticket.description}</p>
      <p className="mb-1"><strong>Status:</strong> {ticket.status}</p>
      <p className="mb-1"><strong>Priority:</strong> {ticket.priority}</p>
      <p className="mb-1"><strong>Assigned To:</strong> {ticket.assignedTo || 'Unassigned'}</p>
      <p className="mb-1"><strong>Created At:</strong> {formatDate(ticket.createdAt)}</p>
      <p className="mb-1"><strong>Updated At:</strong> {formatDate(ticket.updatedAt)}</p>
      {/* TODO: Add communication history */}
    </div>
  );
};

export default TicketDetails;
