// src/pages/customerService/hooks/useTickets.ts

import { useState, useEffect } from 'react';
import { Ticket } from '../types';

// Placeholder data fetcher - replace with real API (e.g., Supabase)
const fetchTickets = async (): Promise<Ticket[]> => {
    // TODO: replace with your actual data fetching logic
    return [
        {
            id: '1',
            title: 'Issue with ice coffee',
            description: 'tunaw na yung yelo pag dineliver',
            status: 'Open',
            priority: 'High',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            customerId: 'cust123',
            assignedTo: 'agent1',
            internalNotes: [],
        },
    ];
};

export const useTickets = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTickets()
            .then(setTickets)
            .catch((err) => setError(err.message || 'Error fetching tickets'))
            .finally(() => setLoading(false));
    }, []);

    return { tickets, loading, error, setTickets };
};
