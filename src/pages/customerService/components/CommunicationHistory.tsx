// src/pages/customerService/components/CommunicationHistory.tsx

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Phone, MessageCircle, User, Send, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Communication {
  id: string;
  ticket_id: string;
  customer_id: string;
  communication_type: 'email' | 'chat' | 'phone' | 'internal';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  agent_id?: string;
  created_at: string;
  ticket?: {
    title: string;
    priority: string;
    status: string;
  };
}

interface CommunicationHistoryProps {
  customerId?: string;
  ticketId?: string;
}

const CommunicationHistory: React.FC<CommunicationHistoryProps> = ({ customerId, ticketId }) => {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId || '');
  const [newCommunication, setNewCommunication] = useState({
    ticket_id: ticketId || '',
    customer_id: selectedCustomerId,
    communication_type: 'email' as Communication['communication_type'],
    direction: 'outbound' as Communication['direction'],
    subject: '',
    content: '',
    agent_id: 'current-agent'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [customerId, ticketId]);

  const fetchData = async () => {
    try {
      let query = supabase
        .from('customer_communications')
        .select(`
          *,
          ticket:tickets(title, priority, status)
        `)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      if (ticketId) {
        query = query.eq('ticket_id', ticketId);
      }

      const { data: commsData, error: commsError } = await query;
      if (commsError) throw commsError;

      setCommunications(commsData?.map(comm => ({
        ...comm,
        communication_type: comm.communication_type as Communication['communication_type'],
        direction: comm.direction as Communication['direction']
      })) || []);

      // Fetch tickets for dropdown
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, title, status, priority')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      setTickets(ticketsData || []);
    } catch (error) {
      console.error('Error fetching communication history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCommunication = async () => {
    try {
      const { error } = await supabase
        .from('customer_communications')
        .insert(newCommunication);

      if (error) throw error;

      await fetchData();
      setShowAddDialog(false);
      setNewCommunication({
        ticket_id: ticketId || '',
        customer_id: selectedCustomerId,
        communication_type: 'email',
        direction: 'outbound',
        subject: '',
        content: '',
        agent_id: 'current-agent'
      });

      toast({
        title: "Success",
        description: "Communication logged successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log communication",
        variant: "destructive",
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'chat': return <MessageCircle className="h-4 w-4" />;
      case 'internal': return <User className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'inbound' ? 
      <ArrowDown className="h-3 w-3 text-blue-600" /> : 
      <ArrowUp className="h-3 w-3 text-green-600" />;
  };

  if (loading) {
    return <div className="p-6">Loading communication history...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Communication History</h2>
          <p className="text-muted-foreground">
            {customerId ? `Customer: ${customerId}` : 'All customer communications'}
          </p>
        </div>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Log Communication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log New Communication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {!customerId && (
                <div>
                  <label className="text-sm font-medium">Customer ID</label>
                  <Input
                    value={newCommunication.customer_id}
                    onChange={(e) => setNewCommunication({
                      ...newCommunication,
                      customer_id: e.target.value
                    })}
                    placeholder="Enter customer ID"
                  />
                </div>
              )}
              
              {!ticketId && (
                <div>
                  <label className="text-sm font-medium">Ticket</label>
                  <Select
                    value={newCommunication.ticket_id}
                    onValueChange={(value) => setNewCommunication({
                      ...newCommunication,
                      ticket_id: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ticket (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {tickets.map(ticket => (
                        <SelectItem key={ticket.id} value={ticket.id}>
                          {ticket.title} - {ticket.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newCommunication.communication_type}
                    onValueChange={(value: Communication['communication_type']) => 
                      setNewCommunication({
                        ...newCommunication,
                        communication_type: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Direction</label>
                  <Select
                    value={newCommunication.direction}
                    onValueChange={(value: Communication['direction']) => 
                      setNewCommunication({
                        ...newCommunication,
                        direction: value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inbound">Inbound</SelectItem>
                      <SelectItem value="outbound">Outbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Subject (optional)</label>
                <Input
                  value={newCommunication.subject}
                  onChange={(e) => setNewCommunication({
                    ...newCommunication,
                    subject: e.target.value
                  })}
                  placeholder="Communication subject"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={newCommunication.content}
                  onChange={(e) => setNewCommunication({
                    ...newCommunication,
                    content: e.target.value
                  })}
                  placeholder="Communication details..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCommunication}>
                  Log Communication
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Communications List */}
      <div className="space-y-4">
        {communications.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No communications found
            </CardContent>
          </Card>
        ) : (
          communications.map(comm => (
            <Card key={comm.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(comm.communication_type)}
                      <span className="font-medium capitalize">{comm.communication_type}</span>
                      {getDirectionIcon(comm.direction)}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {comm.direction}
                    </Badge>
                    {comm.ticket && (
                      <Badge variant="secondary">
                        {comm.ticket.title}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(comm.created_at).toLocaleString()}
                  </div>
                </div>
                {comm.subject && (
                  <CardTitle className="text-lg">{comm.subject}</CardTitle>
                )}
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">{comm.content}</div>
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                  <span>Customer: {comm.customer_id}</span>
                  {comm.agent_id && <span>Agent: {comm.agent_id}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CommunicationHistory;