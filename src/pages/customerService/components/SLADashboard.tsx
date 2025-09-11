
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

interface SLARule {
  id: string;
  priority: string;
  response_time_hours: number;
  resolution_time_hours: number;
  is_active: boolean;
}

interface TicketSLA {
  id: string;
  title: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  response_due: Date;
  resolution_due: Date;
  is_response_overdue: boolean;
  is_resolution_overdue: boolean;
  response_time_remaining: number;
  resolution_time_remaining: number;
}

const SLADashboard: React.FC = () => {
  const [slaRules, setSlaRules] = useState<SLARule[]>([]);
  const [tickets, setTickets] = useState<TicketSLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    onTime: 0,
    atRisk: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch SLA rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('sla_rules')
        .select('*')
        .eq('is_active', true);

      if (rulesError) throw rulesError;
      setSlaRules(rulesData || []);

      // Fetch tickets with SLA calculations
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .in('status', ['Open', 'In Progress']);

      if (ticketsError) throw ticketsError;

      const now = new Date();
      const ticketsWithSLA = (ticketsData || []).map(ticket => {
        const rule = rulesData?.find(r => r.priority === ticket.priority);
        if (!rule) return null;

        const createdAt = new Date(ticket.created_at);
        const responseDue = new Date(createdAt.getTime() + rule.response_time_hours * 60 * 60 * 1000);
        const resolutionDue = new Date(createdAt.getTime() + rule.resolution_time_hours * 60 * 60 * 1000);

        const responseTimeRemaining = Math.max(0, responseDue.getTime() - now.getTime());
        const resolutionTimeRemaining = Math.max(0, resolutionDue.getTime() - now.getTime());

        return {
          ...ticket,
          response_due: responseDue,
          resolution_due: resolutionDue,
          is_response_overdue: now > responseDue,
          is_resolution_overdue: now > resolutionDue,
          response_time_remaining: responseTimeRemaining,
          resolution_time_remaining: resolutionTimeRemaining
        };
      }).filter(Boolean) as TicketSLA[];

      setTickets(ticketsWithSLA);

      // Calculate stats
      const total = ticketsWithSLA.length;
      const overdue = ticketsWithSLA.filter(t => t.is_resolution_overdue).length;
      const atRisk = ticketsWithSLA.filter(t => 
        !t.is_resolution_overdue && 
        t.resolution_time_remaining < (2 * 60 * 60 * 1000) // Less than 2 hours remaining
      ).length;
      const onTime = total - overdue - atRisk;

      setStats({ total, onTime, atRisk, overdue });
    } catch (error) {
      console.error('Error fetching SLA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  const getSLAStatus = (ticket: TicketSLA) => {
    if (ticket.is_resolution_overdue) return { status: 'overdue', color: 'destructive' };
    if (ticket.resolution_time_remaining < 2 * 60 * 60 * 1000) return { status: 'at-risk', color: 'warning' };
    return { status: 'on-time', color: 'success' };
  };

  const getProgressPercentage = (ticket: TicketSLA) => {
    const rule = slaRules.find(r => r.priority === ticket.priority);
    if (!rule) return 0;
    
    const totalTime = rule.resolution_time_hours * 60 * 60 * 1000;
    const elapsed = totalTime - ticket.resolution_time_remaining;
    return Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
  };

  if (loading) {
    return <div className="p-6">Loading SLA Dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">SLA Dashboard</h2>
        <p className="text-muted-foreground">Monitor service level agreement compliance</p>
      </div>

      {/* SLA Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.onTime}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.atRisk}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.atRisk / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.overdue / stats.total) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SLA Rules */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {slaRules.map(rule => (
              <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Badge variant={
                    rule.priority === 'High' ? 'destructive' : 
                    rule.priority === 'Medium' ? 'default' : 'secondary'
                  }>
                    {rule.priority}
                  </Badge>
                  <span className="text-sm">Priority</span>
                </div>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span>Response: {rule.response_time_hours}h</span>
                  <span>Resolution: {rule.resolution_time_hours}h</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Tickets with SLA Status */}
      <Card>
        <CardHeader>
          <CardTitle>Active Tickets - SLA Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No active tickets</p>
            ) : (
              tickets.map(ticket => {
                const slaStatus = getSLAStatus(ticket);
                const progress = getProgressPercentage(ticket);
                
                return (
                  <div key={ticket.id} className="border rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{ticket.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            ticket.priority === 'High' ? 'destructive' : 
                            ticket.priority === 'Medium' ? 'default' : 'secondary'
                          }>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="outline">{ticket.status}</Badge>
                          <Badge variant={slaStatus.color as any}>
                            {slaStatus.status.replace('-', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {ticket.is_resolution_overdue ? 
                            'OVERDUE' : 
                            formatTimeRemaining(ticket.resolution_time_remaining) + ' remaining'
                          }
                        </div>
                        <div className="text-muted-foreground">
                          Due: {ticket.resolution_due.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Resolution Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress 
                        value={progress} 
                        className={`h-2 ${ticket.is_resolution_overdue ? '[&>div]:bg-red-500' : 
                          slaStatus.status === 'at-risk' ? '[&>div]:bg-yellow-500' : ''}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SLADashboard;