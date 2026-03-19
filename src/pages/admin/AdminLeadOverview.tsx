import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, TrendingUp, BarChart2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const STAGES = ['new_lead', 'contacted', 'interested', 'visit_scheduled', 'converted', 'not_interested'];
const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead', contacted: 'Contacted', interested: 'Interested',
  visit_scheduled: 'Visit Scheduled', converted: 'Converted', not_interested: 'Not Interested',
};

interface Lead {
  id: string;
  partner_id: string;
  status: string;
  created_at: string;
}

interface PartnerProfile {
  id: string;
  name: string;
}

const AdminLeadOverview: React.FC = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [partners, setPartners] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: leadsData, error } = await supabase
        .from('partner_leads')
        .select('id, partner_id, status, created_at')
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: 'Failed to load leads', variant: 'destructive' });
      } else {
        setLeads((leadsData as any) || []);
        // Fetch partner names
        const partnerIds = [...new Set((leadsData || []).map((l: any) => l.partner_id))];
        if (partnerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', partnerIds);
          const map: Record<string, string> = {};
          (profiles || []).forEach((p: any) => { map[p.id] = p.name || 'Unknown'; });
          setPartners(map);
        }
      }
      setLoading(false);
    })();
  }, [toast]);

  // Per-partner stats
  const partnerStats = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    leads.forEach((l) => {
      if (!grouped[l.partner_id]) grouped[l.partner_id] = [];
      grouped[l.partner_id].push(l);
    });
    return Object.entries(grouped)
      .map(([pid, pLeads]) => {
        const total = pLeads.length;
        const converted = pLeads.filter((l) => l.status === 'converted').length;
        return { partnerId: pid, name: partners[pid] || 'Unknown', total, converted, rate: total ? Math.round((converted / total) * 100) : 0 };
      })
      .sort((a, b) => b.total - a.total);
  }, [leads, partners]);

  // Funnel
  const funnel = useMemo(() => {
    const total = leads.length || 1;
    return STAGES.map((s) => {
      const count = leads.filter((l) => l.status === s).length;
      return { stage: s, label: STAGE_LABELS[s], count, pct: Math.round((count / total) * 100) };
    });
  }, [leads]);

  const totalLeads = leads.length;
  const totalConverted = leads.filter((l) => l.status === 'converted').length;
  const overallRate = totalLeads ? Math.round((totalConverted / totalLeads) * 100) : 0;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold">Lead Overview</h1>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{totalLeads}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold">{totalConverted}</p>
            <p className="text-xs text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <BarChart2 className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-2xl font-bold">{overallRate}%</p>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Lead Funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {funnel.map((f) => (
            <div key={f.stage}>
              <div className="flex justify-between text-xs mb-1">
                <span>{f.label}</span>
                <span className="font-medium">{f.count} ({f.pct}%)</span>
              </div>
              <Progress value={f.pct} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Per-partner table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Partner Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Partner</th>
                  <th className="text-right py-2 font-medium">Total</th>
                  <th className="text-right py-2 font-medium">Converted</th>
                  <th className="text-right py-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {partnerStats.map((p) => (
                  <tr key={p.partnerId} className="border-b last:border-0">
                    <td className="py-2">{p.name}</td>
                    <td className="text-right py-2">{p.total}</td>
                    <td className="text-right py-2">{p.converted}</td>
                    <td className="text-right py-2 font-medium">{p.rate}%</td>
                  </tr>
                ))}
                {partnerStats.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-muted-foreground">No leads data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeadOverview;
