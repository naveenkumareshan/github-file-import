import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, MessageCircle, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'new_lead', label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
  { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'interested', label: 'Interested', color: 'bg-purple-100 text-purple-800' },
  { value: 'visit_scheduled', label: 'Visit Scheduled', color: 'bg-orange-100 text-orange-800' },
  { value: 'converted', label: 'Converted', color: 'bg-green-100 text-green-800' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-800' },
];

const CATEGORY_LABELS: Record<string, string> = {
  hostel: 'Hostel', pg: 'PG', reading_room: 'Reading Room', laundry: 'Laundry', mess: 'Food / Mess',
};

const SOURCE_LABELS: Record<string, string> = {
  walk_in: 'Walk-in', app: 'App', call: 'Call', referral: 'Referral',
};

interface Lead {
  id: string;
  name: string;
  phone: string;
  category: string;
  source: string;
  status: string;
  serial_number: string | null;
  created_at: string;
}

interface Note {
  id: string;
  remark: string;
  created_at: string;
  user_id: string;
}

interface LeadDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  notes: Note[];
  onStatusChange: (leadId: string, status: string) => Promise<void>;
  onAddNote: (leadId: string, remark: string) => Promise<void>;
  partnerName?: string;
}

const LeadDetailSheet: React.FC<LeadDetailSheetProps> = ({
  open, onOpenChange, lead, notes, onStatusChange, onAddNote, partnerName = 'InhaleStays',
}) => {
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  if (!lead) return null;

  const handleStatusChange = async (status: string) => {
    setChangingStatus(true);
    try { await onStatusChange(lead.id, status); } finally { setChangingStatus(false); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      await onAddNote(lead.id, newNote.trim());
      setNewNote('');
    } finally {
      setSavingNote(false);
    }
  };

  const whatsappUrl = `https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, this is from ${partnerName} regarding your enquiry.`)}`;

  const statusObj = STATUS_OPTIONS.find((s) => s.value === lead.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <SheetTitle className="text-base">Lead Details</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-70px)]">
          <div className="p-5 space-y-5">
            {/* Info */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{lead.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <a href={`tel:${lead.phone}`} className="font-medium text-primary flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {lead.phone}
                </a>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <Badge variant="outline" className="mt-0.5">{CATEGORY_LABELS[lead.category] || lead.category}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <Badge variant="outline" className="mt-0.5">{SOURCE_LABELS[lead.source] || lead.source}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{format(new Date(lead.created_at), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
              {lead.serial_number && (
                <div>
                  <p className="text-xs text-muted-foreground">Serial</p>
                  <p className="text-sm font-mono">{lead.serial_number}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild className="flex-1">
                <a href={`tel:${lead.phone}`}><Phone className="h-4 w-4 mr-1.5" /> Call</a>
              </Button>
              <Button size="sm" variant="outline" asChild className="flex-1">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
                </a>
              </Button>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Status</p>
              <Select value={lead.status} onValueChange={handleStatusChange} disabled={changingStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes & Remarks</p>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a remark..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                />
                <Button size="icon" onClick={handleAddNote} disabled={savingNote || !newNote.trim()}>
                  {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="space-y-3">
                {notes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
                )}
                {notes.map((note) => (
                  <div key={note.id} className="border rounded-lg p-3 bg-muted/30">
                    <p className="text-sm">{note.remark}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {format(new Date(note.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default LeadDetailSheet;
