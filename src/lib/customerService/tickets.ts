import { supabase } from '@/integrations/supabase/client';
import { Ticket, InternalNote } from '@/pages/customerService/types';

export const createTicket = async (ticketData: Partial<Ticket>) => {
    const { data, error } = await supabase
        .from('tickets')
        .insert({
            title: ticketData.title,
            description: ticketData.description,
            status: ticketData.status || 'Open',
            priority: ticketData.priority || 'Medium',
            assigned_to: ticketData.assignedTo,
            created_by: 'Support Agent' // Default for now
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    const { data, error } = await supabase
        .from('tickets')
        .update({
            title: updates.title,
            description: updates.description,
            status: updates.status,
            priority: updates.priority,
            assigned_to: updates.assignedTo,
            updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const addInternalNote = async (ticketId: string, note: string, author: string = 'Support Agent') => {
    const { data, error } = await supabase
        .from('internal_notes')
        .insert({
            ticket_id: ticketId,
            note,
            created_by: author
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getTicketWithNotes = async (ticketId: string) => {
    const { data, error } = await supabase
        .from('tickets')
        .select(`
            *,
            internal_notes (*)
        `)
        .eq('id', ticketId)
        .single();

    if (error) throw error;
    return data;
};