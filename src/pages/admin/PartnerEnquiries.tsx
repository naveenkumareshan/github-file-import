
import React, { useEffect, useState } from 'react';
import { getPublicAppUrl } from '@/utils/appUrl';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Mail, MapPin, Search, Building, Hotel, UtensilsCrossed, Shirt, Loader2, ExternalLink, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['new', 'contacted', 'follow_up', 'converted', 'closed'] as const;
type Status = typeof STATUS_OPTIONS[number];

const STATUS_COLORS: Record<Status, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  follow_up: 'bg-orange-100 text-orange-800',
  converted: 'bg-green-100 text-green-800',
  closed: 'bg-muted text-muted-foreground',
};

const PROPERTY_ICONS: Record<string, React.ComponentType<any>> = {
  reading_room: Building,
  hostel: Hotel,
  mess: UtensilsCrossed,
  laundry: Shirt,
};

const PROPERTY_LABELS: Record<string, string> = {
  reading_room: 'Reading Room',
  hostel: 'Hostel',
  mess: 'Mess',
  laundry: 'Laundry',
};

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  property_types: string[];
  message: string | null;
  status: Status;
  admin_notes: string | null;
  serial_number: string | null;
  created_at: string;
  updated_at: string;
}

const PartnerEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [editStatus, setEditStatus] = useState<Status>('new');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchEnquiries = async () => {
    setLoading(true);
    let query = supabase.from('partner_enquiries' as any).select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error loading enquiries', description: error.message, variant: 'destructive' });
    } else {
      setEnquiries((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEnquiries(); }, [filter]);

  const filtered = enquiries.filter(e => {
    if (!search) return true;
    const s = search.toLowerCase();
    return e.name.toLowerCase().includes(s) || e.phone.includes(s) || (e.email?.toLowerCase().includes(s)) || (e.city?.toLowerCase().includes(s)) || (e.serial_number?.toLowerCase().includes(s));
  });

  const openEdit = (enq: Enquiry) => {
    setSelectedEnquiry(enq);
    setEditStatus(enq.status);
    setEditNotes(enq.admin_notes || '');
  };

  const saveChanges = async () => {
    if (!selectedEnquiry) return;
    setSaving(true);
    const { error } = await supabase.from('partner_enquiries' as any).update({
      status: editStatus,
      admin_notes: editNotes.trim() || null,
    }).eq('id', selectedEnquiry.id);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Enquiry updated' });
      setSelectedEnquiry(null);
      fetchEnquiries();
    }
    setSaving(false);
  };

  const statusCounts = enquiries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Partner Enquiries</h1>
          <p className="text-sm text-muted-foreground">Manage demo requests from potential partners</p>
          <PartnerLinkCopy />
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">{filtered.length} total</Badge>
          {statusCounts.new > 0 && (
            <Badge className="bg-red-100 text-red-800">{statusCounts.new} new</Badge>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="w-full overflow-x-auto flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">
            All
          </TabsTrigger>
          {STATUS_OPTIONS.map(s => (
            <TabsTrigger key={s} value={s} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs capitalize">
              {s.replace('_', ' ')} {statusCounts[s] ? `(${statusCounts[s]})` : ''}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No enquiries found</CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Serial</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">City</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Property Types</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((enq, i) => (
                  <TableRow key={enq.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/10'}>
                    <TableCell className="text-xs font-mono">{enq.serial_number || '—'}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{enq.name}</div>
                      {enq.email && <div className="text-xs text-muted-foreground">{enq.email}</div>}
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${enq.phone}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {enq.phone}
                      </a>
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{enq.city || '—'}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {enq.property_types?.map(pt => {
                          const Icon = PROPERTY_ICONS[pt];
                          return (
                            <Badge key={pt} variant="outline" className="text-xs gap-1">
                              {Icon && <Icon className="h-3 w-3" />}
                              {PROPERTY_LABELS[pt] || pt}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs capitalize ${STATUS_COLORS[enq.status as Status] || ''}`}>
                        {enq.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                      {format(new Date(enq.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openEdit(enq)} className="text-xs h-7">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!selectedEnquiry} onOpenChange={open => !open && setSelectedEnquiry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enquiry Details</DialogTitle>
          </DialogHeader>
          {selectedEnquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{selectedEnquiry.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Serial</p>
                  <p className="font-mono text-xs">{selectedEnquiry.serial_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <a href={`tel:${selectedEnquiry.phone}`} className="text-primary hover:underline flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {selectedEnquiry.phone}
                  </a>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p>{selectedEnquiry.email || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">City</p>
                  <p>{selectedEnquiry.city || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Date</p>
                  <p>{format(new Date(selectedEnquiry.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">Property Types</p>
                <div className="flex flex-wrap gap-1">
                  {selectedEnquiry.property_types?.map(pt => (
                    <Badge key={pt} variant="outline" className="text-xs capitalize gap-1">
                      {PROPERTY_LABELS[pt] || pt}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedEnquiry.message && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Message</p>
                  <p className="text-sm bg-muted/50 rounded p-2">{selectedEnquiry.message}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={editStatus} onValueChange={v => setEditStatus(v as Status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Admin Notes</label>
                <Textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  rows={3}
                  maxLength={2000}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveChanges} disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="outline" asChild>
                  <a href={`https://wa.me/${selectedEnquiry.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerEnquiries;
