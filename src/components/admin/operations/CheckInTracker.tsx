
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, isEqual, parseISO } from 'date-fns';
import { Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

type Module = 'reading_room' | 'hostel';

const CheckInTracker = () => {
  const [module, setModule] = useState<Module>('reading_room');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Reading room bookings query
  const { data: rrBookings = [], isLoading: rrLoading } = useQuery({
    queryKey: ['checkin-rr-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles:user_id(name, phone, email), cabins:cabin_id(name), seats:seat_id(number)')
        .is('checked_in_at', null)
        .in('payment_status', ['completed', 'advance_paid'])
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: module === 'reading_room',
  });

  // Hostel bookings query
  const { data: hostelBookings = [], isLoading: hostelLoading } = useQuery({
    queryKey: ['checkin-hostel-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hostel_bookings')
        .select('*, profiles:user_id(name, phone, email), hostels:hostel_id(name), hostel_rooms:room_id(room_number), hostel_beds:bed_id(bed_number)')
        .is('checked_in_at', null)
        .in('payment_status', ['completed', 'advance_paid'])
        .order('start_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: module === 'hostel',
  });

  const markReportedMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: Module }) => {
      const table = type === 'reading_room' ? 'bookings' : 'hostel_bookings';
      const { error } = await supabase
        .from(table)
        .update({
          checked_in_at: new Date().toISOString(),
          checked_in_by: user?.id,
          check_in_notes: notes,
        } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Marked as reported', description: 'Student has been checked in successfully.' });
      queryClient.invalidateQueries({ queryKey: ['checkin-rr-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['checkin-hostel-bookings'] });
      setDialogOpen(false);
      setNotes('');
      setSelectedBooking(null);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleMarkReported = (booking: any) => {
    setSelectedBooking(booking);
    setNotes('');
    setDialogOpen(true);
  };

  const confirmMarkReported = () => {
    if (!selectedBooking) return;
    markReportedMutation.mutate({ id: selectedBooking.id, type: module });
  };

  const isLoading = module === 'reading_room' ? rrLoading : hostelLoading;
  const bookings = module === 'reading_room' ? rrBookings : hostelBookings;

  const filtered = bookings.filter((b: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = b.profiles?.name?.toLowerCase() || '';
    const phone = b.profiles?.phone?.toLowerCase() || '';
    const email = b.profiles?.email?.toLowerCase() || '';
    return name.includes(q) || phone.includes(q) || email.includes(q);
  });

  const isNoShow = (startDate: string) => {
    return startDate === yesterday;
  };

  return (
    <div className="space-y-4">
      {/* Module toggle + search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-0.5">
          <Button
            variant={module === 'reading_room' ? 'default' : 'ghost'}
            size="sm"
            className="text-xs h-7"
            onClick={() => setModule('reading_room')}
          >
            Reading Room
          </Button>
          <Button
            variant={module === 'hostel' ? 'default' : 'ghost'}
            size="sm"
            className="text-xs h-7"
            onClick={() => setModule('hostel')}
          >
            Hostel
          </Button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
          All students have reported!
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-3 font-medium">Student</th>
                <th className="text-left py-2 px-3 font-medium">
                  {module === 'reading_room' ? 'Room / Seat' : 'Hostel / Bed'}
                </th>
                <th className="text-left py-2 px-3 font-medium">Start Date</th>
                <th className="text-left py-2 px-3 font-medium">Payment</th>
                <th className="text-right py-2 px-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b: any) => {
                const startDate = b.start_date;
                const noShow = isNoShow(startDate);
                return (
                  <tr key={b.id} className={`border-b last:border-0 ${noShow ? 'bg-destructive/5' : 'hover:bg-muted/30'}`}>
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
                      <div className="flex items-center gap-1">
                        {noShow && <AlertTriangle className="h-3 w-3 text-destructive" />}
                        <span className={noShow ? 'text-destructive font-medium' : ''}>
                          {startDate ? format(parseISO(startDate), 'dd MMM yyyy') : '—'}
                        </span>
                      </div>
                      {noShow && <div className="text-[10px] text-destructive">Yesterday - No show</div>}
                    </td>
                    <td className="py-1.5 px-3">
                      <Badge variant={b.payment_status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                        {b.payment_status}
                      </Badge>
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleMarkReported(b)}>
                        Mark Reported
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mark Reported Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Mark as Reported</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Student: </span>
              <span className="font-medium">{selectedBooking?.profiles?.name || 'N/A'}</span>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about the reporting..."
                className="mt-1 text-sm"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={confirmMarkReported} disabled={markReportedMutation.isPending}>
              {markReportedMutation.isPending ? 'Saving...' : 'Confirm Reported'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckInTracker;
