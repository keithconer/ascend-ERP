// src/pages/customerService/types.ts

export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type PriorityLevel = 'Low' | 'Medium' | 'High';

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: TicketStatus;
    priority: PriorityLevel;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
    assignedTo?: string; // Support agent ID or name
    customerId: string;
    internalNotes?: InternalNote[];
}

export interface InternalNote {
    id: string;
    ticketId: string;
    author: string;
    note: string;
    createdAt: string;
}
