// src/pages/customerService/components/TicketNotes.tsx

import React, { useState } from 'react';
import { InternalNote } from '../types';
import { formatDate } from '../utils';

interface TicketNotesProps {
  notes?: InternalNote[];
  onAddNote: (note: string) => void;
}

const TicketNotes: React.FC<TicketNotesProps> = ({ notes = [], onAddNote }) => {
  const [noteText, setNoteText] = useState('');

  const handleAddNote = () => {
    if (noteText.trim() === '') return;
    onAddNote(noteText);
    setNoteText('');
  };

  return (
    <div className="border rounded p-4 bg-white shadow">
      <h3 className="text-lg font-bold mb-2">Internal Notes</h3>
      <div className="max-h-48 overflow-y-auto mb-4 space-y-2">
        {notes.length === 0 ? (
          <p className="text-gray-500">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="border-b pb-1">
              <p>{note.note}</p>
              <small className="text-gray-400">
                By {note.author} on {formatDate(note.createdAt)}
              </small>
            </div>
          ))
        )}
      </div>
      <textarea
        className="w-full border rounded p-2 mb-2"
        rows={3}
        placeholder="Add a new internal note..."
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
      />
      <button
        onClick={handleAddNote}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Add Note
      </button>
    </div>
  );
};

export default TicketNotes;
