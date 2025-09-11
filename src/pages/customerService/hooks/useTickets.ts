// src/pages/customerService/hooks/useTickets.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, InternalNote } from '../types';

const fetchTickets = async (): Promise<Ticket[]> => {
    const { data: tickets, error } = await supabase
        .from('tickets')
        .select(`
            *,
            internal_notes (*)
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return tickets?.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description || '',
        status: ticket.status as Ticket['status'],
        priority: ticket.priority as Ticket['priority'],
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at || ticket.created_at,
        customerId: 'customer', // Default customer ID
        assignedTo: ticket.assigned_to,
        internalNotes: ticket.internal_notes?.map((note: any) => ({
            id: note.id,
            ticketId: note.ticket_id,
            author: note.created_by || 'Unknown',
            note: note.note,
            createdAt: note.created_at
        })) || []
    })) || [];
};

export const useTickets = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const fetchedTickets = await fetchTickets();
            setTickets(fetchedTickets);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Error fetching tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTickets();
    }, []);

    return { tickets, loading, error, setTickets, refetch: loadTickets };
};
