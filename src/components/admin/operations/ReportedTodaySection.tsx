
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, parseISO, startOfDay } from 'date-fns';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

type Module = 'reading_room' | 'hostel';

const ReportedTodaySection = ({ module }: { module: Module }) => {
  const [open, setOpen] = useState(true);
  const todayStart = startOfDay(new Date()).toISOString();

  const { data: reportedRR = [] } = useQuery({
    queryKey: ['reported-today-rr', todayStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles:user_id(name, phone, email), cabins:cabin_id(name), seats:seat_id(number)')
        .gte('checked_in_at', todayStart)
        .order('checked_in_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: module === 'reading_room',
  });

  const { data: reportedHostel = [] } = useQuery({
    queryKey: ['reported-today-hostel', todayStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hostel_bookings')
        .select('*, profiles:user_id(name, phone, email), hostels:hostel_id(name), hostel_beds:bed_id(bed_number)')
        .gte('checked_in_at', todayStart)
        .order('checked_in_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: module === 'hostel',
  });

  const reported = module === 'reading_room' ? reportedRR : reportedHostel;

  if (reported.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between h-8 px-3 bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50 text-green-700 dark:text-green-400 text-xs font-medium rounded-lg">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Reported Today ({reported.length})
          </div>
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border rounded-lg overflow-x-auto mt-2">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-green-50/50 dark:bg-green-950/20">
                <th className="text-left py-2 px-3 font-medium">Student</th>
                <th className="text-left py-2 px-3 font-medium">
                  {module === 'reading_room' ? 'Room / Seat' : 'Hostel / Bed'}
                </th>
                <th className="text-left py-2 px-3 font-medium">Start Date</th>
                <th className="text-left py-2 px-3 font-medium">Payment</th>
                <th className="text-left py-2 px-3 font-medium">Reported At</th>
                <th className="text-left py-2 px-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {reported.map((b: any) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-1.5 px-3">
                    <div className="font-medium">{b.profiles?.name || 'N/A'}</div>
                    <div className="text-muted-foreground">{b.profiles?.phone || b.profiles?.email || ''}</div>
                  </td>
                  <td className="py-1.5 px-3">
                    {module === 'reading_room' ? (
                      <span>{b.cabins?.name || '—'} / Seat #{b.seats?.number || '—'}</span>
                    ) : (
                      <span>{b.hostels?.name || '—'} / Bed #{b.hostel_beds?.bed_number || '—'}</span>
                    )}
                  </td>
                  <td className="py-1.5 px-3">
                    {b.start_date ? format(parseISO(b.start_date), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="py-1.5 px-3">
                    <Badge variant={b.payment_status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                      {b.payment_status}
                    </Badge>
                  </td>
                  <td className="py-1.5 px-3">
                    {b.checked_in_at ? format(parseISO(b.checked_in_at), 'hh:mm a') : '—'}
                  </td>
                  <td className="py-1.5 px-3 max-w-[150px] truncate">
                    {b.check_in_notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ReportedTodaySection;
