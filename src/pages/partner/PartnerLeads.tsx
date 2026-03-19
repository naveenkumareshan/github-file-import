import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEffectiveOwnerId } from '@/utils/getEffectiveOwnerId';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, LayoutGrid, List, Phone, Users, TrendingUp, CalendarDays, UserPlus } from 'lucide-react';
import { format, isToday, isThisWeek, startOfDay } from 'date-fns';
import AddLeadDialog from '@/components/partner/AddLeadDialog';
import LeadDetailSheet from '@/components/partner/LeadDetailSheet';
import LeadKanbanBoard from '@/components/partner/LeadKanbanBoard';

const STATUS_OPTIONS = [
  { value: 'new_lead', label: 'New Lead', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { value: 'interested', label: 'Interested', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'visit_scheduled', label: 'Visit Scheduled', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
];

const CATEGORY_LABELS: Record<string, string> = {
  hostel: 'Hostel', pg: 'PG', reading_room: 'Reading Room', laundry: 'Laundry', mess: 'Food / Mess',
};

interface Lead {
  id: string;
  partner_id: string;
  name: string;
  phone: string;
  category: string;
  source: string;
  status: string;
  serial_number: string | null;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  lead_id: string;
  user_id: string;
  remark: string;
  created_at: string;
}

const PartnerLeads: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Init partner
  useEffect(() => {
    (async () => {
      try {
        const { ownerId } = await getEffectiveOwnerId();
        setPartnerId(ownerId);
      } catch {
        if (user?.id) setPartnerId(user.id);
      }
    })();
  }, [user?.id]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    if (!partnerId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('partner_leads')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Failed to load leads', variant: 'destructive' });
    } else {
      setLeads((data as any) || []);
    }
    setLoading(false);
  }, [partnerId, toast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Realtime subscription
  useEffect(() => {
    if (!partnerId) return;
    const channel = supabase
      .channel('partner-leads-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_leads', filter: `partner_id=eq.${partnerId}` }, () => {
        fetchLeads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [partnerId, fetchLeads]);

  // Fetch notes for selected lead
  useEffect(() => {
    if (!selectedLead) { setNotes([]); return; }
    (async () => {
      const { data } = await supabase
        .from('partner_lead_notes')
        .select('*')
        .eq('lead_id', selectedLead.id)
        .order('created_at', { ascending: false });
      setNotes((data as any) || []);
    })();
  }, [selectedLead]);

  const handleAddLead = async (data: { name: string; phone: string; category: string; source: string }) => {
    if (!partnerId) return;
    const { error } = await supabase.from('partner_leads').insert({
      partner_id: partnerId,
      name: data.name,
      phone: data.phone,
      category: data.category,
      source: data.source,
    } as any);
    if (error) {
      toast({ title: 'Failed to add lead', variant: 'destructive' });
      throw error;
    }
    toast({ title: 'Lead added!' });
    fetchLeads();
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    const { error } = await supabase.from('partner_leads').update({ status } as any).eq('id', leadId);
    if (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    } else {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l));
      if (selectedLead?.id === leadId) setSelectedLead((prev) => prev ? { ...prev, status } : null);
    }
  };

  const handleAddNote = async (leadId: string, remark: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('partner_lead_notes').insert({
      lead_id: leadId,
      user_id: user.id,
      remark,
    } as any);
    if (error) {
      toast({ title: 'Failed to add note', variant: 'destructive' });
    } else {
      // Refresh notes
      const { data } = await supabase
        .from('partner_lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      setNotes((data as any) || []);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter((l) => l.status === 'converted').length;
    const todayLeads = leads.filter((l) => isToday(new Date(l.created_at))).length;
    const weekLeads = leads.filter((l) => isThisWeek(new Date(l.created_at))).length;
    const pending = leads.filter((l) => ['new_lead', 'contacted', 'interested', 'visit_scheduled'].includes(l.status)).length;
    return { total, converted, rate: total ? Math.round((converted / total) * 100) : 0, todayLeads, weekLeads, pending };
  }, [leads]);

  // Filtered leads
  const filtered = useMemo(() => {
    let result = leads;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.name?.toLowerCase().includes(q) || l.phone.includes(q));
    }
    if (filterStatus !== 'all') result = result.filter((l) => l.status === filterStatus);
    if (filterCategory !== 'all') result = result.filter((l) => l.category === filterCategory);
    return result;
  }, [leads, search, filterStatus, filterCategory]);

  const statCards = [
    { label: 'Total Leads', value: stats.total, icon: Users, color: 'text-primary' },
    { label: 'Converted', value: stats.converted, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Conversion %', value: `${stats.rate}%`, icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Today', value: stats.todayLeads, icon: CalendarDays, color: 'text-blue-600' },
    { label: 'This Week', value: stats.weekLeads, icon: CalendarDays, color: 'text-orange-600' },
    { label: 'Pending', value: stats.pending, icon: UserPlus, color: 'text-yellow-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Leads CRM</h1>
        <div className="flex gap-2">
          <Button size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>
            <List className="h-4 w-4" />
          </Button>
          <Button size="sm" variant={view === 'kanban' ? 'default' : 'outline'} onClick={() => setView('kanban')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {statCards.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-3 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-[200px] h-9 text-sm" placeholder="Search name/phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Views */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : view === 'kanban' ? (
      <LeadKanbanBoard
          leads={filtered}
          onStatusChange={handleStatusChange}
          onLeadClick={(lead) => setSelectedLead(lead as Lead)}
        />
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No leads found. Add your first lead!</p>
          )}
          {filtered.map((lead) => {
            const statusObj = STATUS_OPTIONS.find((s) => s.value === lead.status);
            return (
              <Card
                key={lead.id}
                className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedLead(lead)}
              >
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{lead.name || 'No Name'}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">{CATEGORY_LABELS[lead.category] || lead.category}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <a href={`tel:${lead.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-primary flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </a>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(lead.created_at), 'dd MMM')}</span>
                    </div>
                  </div>
                  <Select
                    value={lead.status}
                    onValueChange={(v) => { handleStatusChange(lead.id, v); }}
                  >
                    <SelectTrigger
                      className={`w-auto h-7 text-[10px] font-medium border-0 ${statusObj?.color || ''}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Button
        className="fixed bottom-20 right-4 z-50 rounded-full h-14 w-14 shadow-lg"
        onClick={() => setAddOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAddLead} />

      <LeadDetailSheet
        open={!!selectedLead}
        onOpenChange={(open) => { if (!open) setSelectedLead(null); }}
        lead={selectedLead}
        notes={notes}
        onStatusChange={handleStatusChange}
        onAddNote={handleAddNote}
      />
    </div>
  );
};

export default PartnerLeads;
