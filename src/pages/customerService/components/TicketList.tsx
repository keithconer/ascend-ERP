// src/pages/customerService/components/TicketList.tsx

import React from 'react';
import { Ticket } from '../types';
import { formatDate, statusColors, priorityColors } from '../utils';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onSelectTicket }) => {
  if (tickets.length === 0) return <p>No tickets found.</p>;

  return (
    <table className="min-w-full border border-gray-300">
      <thead>
        <tr>
          <th className="border px-4 py-2">Title</th>
          <th className="border px-4 py-2">Status</th>
          <th className="border px-4 py-2">Priority</th>
          <th className="border px-4 py-2">Created At</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr
            key={ticket.id}
            className="cursor-pointer hover:bg-gray-100"
            onClick={() => onSelectTicket(ticket)}
          >
            <td className="border px-4 py-2">{ticket.title}</td>
            <td className={`border px-4 py-2 font-semibold ${statusColors[ticket.status]}`}>
              {ticket.status}
            </td>
            <td className={`border px-4 py-2 ${priorityColors[ticket.priority]}`}>
              {ticket.priority}
            </td>
            <td className="border px-4 py-2">{formatDate(ticket.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TicketList;
