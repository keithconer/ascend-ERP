// src/pages/customerService/utils.ts

import { TicketStatus, PriorityLevel } from './types';

export const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleString();
};

export const statusColors: Record<TicketStatus, string> = {
    'Open': 'text-red-600',
    'In Progress': 'text-yellow-600',
    'Resolved': 'text-green-600',
    'Closed': 'text-gray-600',
};

export const priorityColors: Record<PriorityLevel, string> = {
    'Low': 'text-green-500',
    'Medium': 'text-yellow-500',
    'High': 'text-red-500',
};
