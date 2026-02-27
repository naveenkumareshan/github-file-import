
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { Search, ChevronDown, ChevronUp, Send } from 'lucide-react';

const ComplaintTracker = () => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['ops-complaints', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('complaints')
        .select('*, profiles:user_id(name, phone, email)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('complaints')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Status updated' });
      queryClient.invalidateQueries({ queryKey: ['ops-complaints'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, response }: { id: string; response: string }) => {
      const { error } = await supabase
        .from('complaints')
        .update({
          response,
          responded_by: user?.id,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Response sent' });
      queryClient.invalidateQueries({ queryKey: ['ops-complaints'] });
      setResponseText('');
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const filtered = complaints.filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.subject?.toLowerCase().includes(q) ||
      c.profiles?.name?.toLowerCase().includes(q) ||
      c.serial_number?.toLowerCase().includes(q)
    );
  });

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'destructive';
      case 'in_progress': return 'secondary';
      case 'resolved': return 'default';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setResponseText('');
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search subject, name, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">No complaints found.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-3 font-medium w-6"></th>
                <th className="text-left py-2 px-3 font-medium">ID</th>
                <th className="text-left py-2 px-3 font-medium">Subject</th>
                <th className="text-left py-2 px-3 font-medium">Student</th>
                <th className="text-left py-2 px-3 font-medium">Priority</th>
                <th className="text-left py-2 px-3 font-medium">Status</th>
                <th className="text-left py-2 px-3 font-medium">Date</th>
                <th className="text-right py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <React.Fragment key={c.id}>
                  <tr className="border-b last:border-0 hover:bg-muted/30 cursor-pointer" onClick={() => toggleExpand(c.id)}>
                    <td className="py-1.5 px-3">
                      {expandedId === c.id ? (
                        <ChevronUp className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      )}
                    </td>
                    <td className="py-1.5 px-3 font-mono text-muted-foreground">{c.serial_number || c.id.slice(0, 8)}</td>
                    <td className="py-1.5 px-3 font-medium max-w-[200px] truncate">{c.subject}</td>
                    <td className="py-1.5 px-3">{c.profiles?.name || 'N/A'}</td>
                    <td className="py-1.5 px-3">
                      <Badge variant="outline" className="text-[10px] capitalize">{c.priority}</Badge>
                    </td>
                    <td className="py-1.5 px-3">
                      <Badge variant={statusColor(c.status) as any} className="text-[10px] capitalize">
                        {c.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-1.5 px-3">{format(parseISO(c.created_at), 'dd MMM yyyy')}</td>
                    <td className="py-1.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1 justify-end">
                        {c.status !== 'resolved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-5 text-[9px] px-1.5"
                            onClick={() => updateStatusMutation.mutate({ id: c.id, status: 'resolved' })}
                          >
                            Resolve
                          </Button>
                        )}
                        {c.status === 'open' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 text-[9px] px-1.5"
                            onClick={() => updateStatusMutation.mutate({ id: c.id, status: 'in_progress' })}
                          >
                            In Progress
                          </Button>
                        )}
                        {c.status === 'resolved' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 text-[9px] px-1.5"
                            onClick={() => updateStatusMutation.mutate({ id: c.id, status: 'open' })}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === c.id && (
                    <tr className="bg-muted/20">
                      <td colSpan={8} className="px-3 py-3">
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="font-medium text-muted-foreground">Description:</span>
                            <p className="mt-1">{c.description}</p>
                          </div>
                          {c.response && (
                            <div className="bg-primary/5 rounded p-2">
                              <span className="font-medium text-muted-foreground">Previous Response:</span>
                              <p className="mt-1">{c.response}</p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <Textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Type your response..."
                              className="text-xs flex-1"
                              rows={2}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              className="h-auto"
                              disabled={!responseText.trim() || respondMutation.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                respondMutation.mutate({ id: c.id, response: responseText });
                              }}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComplaintTracker;
