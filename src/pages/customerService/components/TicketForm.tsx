// src/pages/customerService/components/TicketForm.tsx

import React, { useState } from 'react';
import { Ticket, TicketStatus, PriorityLevel } from '../types';

interface TicketFormProps {
  onSubmit: (ticket: Partial<Ticket>) => void;
  initialData?: Partial<Ticket>;
}

const statusOptions: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const priorityOptions: PriorityLevel[] = ['Low', 'Medium', 'High'];

const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, initialData = {} }) => {
  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [status, setStatus] = useState<TicketStatus>(initialData.status || 'Open');
  const [priority, setPriority] = useState<PriorityLevel>(initialData.priority || 'Medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return alert('Title and description are required.');

    onSubmit({
      title,
      description,
      status,
      priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded bg-white shadow">
      <div>
        <label className="block mb-1 font-semibold">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          rows={4}
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TicketStatus)}
          className="w-full border px-3 py-2 rounded"
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-semibold">Priority</label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as PriorityLevel)}
          className="w-full border px-3 py-2 rounded"
        >
          {priorityOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
};

export default TicketForm;
