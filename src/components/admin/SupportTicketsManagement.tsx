import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Headphones, Search, Send } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUSES = ['all', 'open', 'in_progress', 'resolved', 'closed'];

const statusBadge: Record<string, string> = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-muted text-muted-foreground',
};

const SupportTicketsManagement = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    setLoading(true);
    const { data } = await supabase.from('support_tickets').select('*, profiles:user_id(name, email, phone)').order('created_at', { ascending: false });
    setTickets((data as any[]) || []);
    setLoading(false);
  };

  const filtered = tickets.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search && !t.subject?.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleRespond = async () => {
    if (!selected) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const updates: any = {};
    if (adminResponse.trim()) {
      updates.admin_response = adminResponse.trim();
      updates.responded_by = user?.id;
      updates.responded_at = new Date().toISOString();
    }
    if (newStatus) updates.status = newStatus;

    const { error } = await supabase.from('support_tickets').update(updates).eq('id', selected.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update ticket', variant: 'destructive' });
    } else {
      toast({ title: 'Updated', description: 'Support ticket updated' });
      setSelected(null);
      setAdminResponse('');
      setNewStatus('');
      loadTickets();
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Headphones className="h-5 w-5 text-primary" /> Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize text-sm">{s === 'all' ? 'All Status' : s.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">No support tickets found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{format(new Date(t.created_at), 'd MMM yy')}</TableCell>
                      <TableCell className="text-xs">{(t.profiles as any)?.name || '—'}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{t.subject}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{t.category}</Badge></TableCell>
                      <TableCell><span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge[t.status] || ''}`}>{t.status?.replace('_', ' ')}</span></TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelected(t); setNewStatus(t.status); setAdminResponse(t.admin_response || ''); }}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Support Ticket Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">User:</span> {(selected.profiles as any)?.name}</div>
                <div><span className="text-muted-foreground">Email:</span> {(selected.profiles as any)?.email}</div>
                <div><span className="text-muted-foreground">Category:</span> <span className="capitalize">{selected.category}</span></div>
                <div><span className="text-muted-foreground">Date:</span> {format(new Date(selected.created_at), 'd MMM yyyy')}</div>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Subject</p>
                <p className="text-sm">{selected.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Update Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.filter(s => s !== 'all').map(s => (
                      <SelectItem key={s} value={s} className="capitalize text-sm">{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs font-medium mb-1">Admin Response</p>
                <Textarea value={adminResponse} onChange={(e) => setAdminResponse(e.target.value)} rows={3} className="text-sm" placeholder="Write a response…" maxLength={1000} />
              </div>
              <Button onClick={handleRespond} disabled={saving} className="w-full h-9 text-sm gap-1">
                <Send className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Update & Respond'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTicketsManagement;
