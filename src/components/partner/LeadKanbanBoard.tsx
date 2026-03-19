import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const STAGES = [
  { value: 'new_lead', label: 'New Lead', accent: 'border-t-blue-500' },
  { value: 'contacted', label: 'Contacted', accent: 'border-t-yellow-500' },
  { value: 'interested', label: 'Interested', accent: 'border-t-purple-500' },
  { value: 'visit_scheduled', label: 'Visit Sched.', accent: 'border-t-orange-500' },
  { value: 'converted', label: 'Converted', accent: 'border-t-green-500' },
  { value: 'not_interested', label: 'Not Interested', accent: 'border-t-red-500' },
];

const CATEGORY_SHORT: Record<string, string> = {
  hostel: 'Hostel', pg: 'PG', reading_room: 'RR', laundry: 'Laundry', mess: 'Mess',
};

interface Lead {
  id: string;
  name: string;
  phone: string;
  category: string;
  source: string;
  status: string;
  created_at: string;
}

interface LeadKanbanBoardProps {
  leads: Lead[];
  onStatusChange: (leadId: string, newStatus: string) => Promise<void>;
  onLeadClick: (lead: Lead) => void;
}

const LeadKanbanBoard: React.FC<LeadKanbanBoardProps> = ({ leads, onStatusChange, onLeadClick }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedId) {
      const lead = leads.find((l) => l.id === draggedId);
      if (lead && lead.status !== status) {
        await onStatusChange(draggedId, status);
      }
    }
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
      {STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.status === stage.value);
        return (
          <div
            key={stage.value}
            className={`flex-shrink-0 w-[220px] bg-muted/40 rounded-xl border-t-4 ${stage.accent}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.value)}
          >
            <div className="p-3 pb-1">
              <p className="text-xs font-semibold flex items-center gap-1.5">
                {stage.label}
                <span className="bg-muted rounded-full px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                  {stageLeads.length}
                </span>
              </p>
            </div>
            <ScrollArea className="h-[350px] px-2 pb-2">
              <div className="space-y-2 p-1">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => onLeadClick(lead)}
                    className="bg-background rounded-lg border p-3 cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <p className="text-sm font-medium truncate">{lead.name || 'No Name'}</p>
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary flex items-center gap-1 mt-1"
                    >
                      <Phone className="h-3 w-3" /> {lead.phone}
                    </a>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {CATEGORY_SHORT[lead.category] || lead.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
                {stageLeads.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No leads</p>
                )}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
};

export default LeadKanbanBoard;
