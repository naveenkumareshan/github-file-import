
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, RefreshCw, Shield, CheckCircle } from 'lucide-react';

export default function HostelDeposits() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refunding, setRefunding] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchDeposits(); }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hostel_bookings')
        .select('*, hostels(name), profiles:user_id(name, email, phone)')
        .gt('security_deposit', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch deposits", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (booking: any) => {
    if (!confirm(`Refund ₹${booking.security_deposit} deposit for ${booking.profiles?.name || 'this student'}?`)) return;
    try {
      setRefunding(booking.id);
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('hostel_receipts').insert({
        booking_id: booking.id,
        user_id: booking.user_id,
        hostel_id: booking.hostel_id,
        amount: booking.security_deposit,
        payment_method: 'cash',
        receipt_type: 'deposit_refund',
        collected_by: user?.id,
        notes: `Security deposit refund for booking ${booking.serial_number || booking.id}`,
      });
      if (error) throw error;

      // Mark deposit as 0 to indicate refunded
      await supabase.from('hostel_bookings').update({ security_deposit: 0 }).eq('id', booking.id);

      toast({ title: "Success", description: "Deposit refunded and receipt created" });
      fetchDeposits();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to process refund", variant: "destructive" });
    } finally {
      setRefunding(null);
    }
  };

  // Check if a deposit has already been refunded (receipt exists)
  const [refundedIds, setRefundedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const checkRefunded = async () => {
      const { data } = await supabase
        .from('hostel_receipts')
        .select('booking_id')
        .eq('receipt_type', 'deposit_refund');
      setRefundedIds(new Set((data || []).map(r => r.booking_id).filter(Boolean)));
    };
    checkRefunded();
  }, [bookings]);

  const filtered = bookings.filter(b => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      b.serial_number?.toLowerCase().includes(s) ||
      b.profiles?.name?.toLowerCase().includes(s) ||
      b.hostels?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Hostel Deposits</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Security deposit tracking and refunds</p>
        </div>
        <Button onClick={fetchDeposits} variant="outline" size="sm" className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 mb-4 p-3 bg-muted/30 rounded-lg border border-border/40">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search by student, booking or hostel..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Shield className="h-8 w-8 opacity-20" />
              <p className="text-sm font-medium">No deposits found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Booking #</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Student</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Hostel</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Deposit</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Booking Date</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 w-28">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((b, idx) => {
                    const isRefunded = refundedIds.has(b.id);
                    return (
                      <TableRow key={b.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <TableCell className="text-sm font-medium">{b.serial_number || '-'}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{b.profiles?.name || '-'}</p>
                          {b.profiles?.phone && <p className="text-xs text-muted-foreground">{b.profiles.phone}</p>}
                        </TableCell>
                        <TableCell className="text-sm">{b.hostels?.name || '-'}</TableCell>
                        <TableCell className="text-sm font-medium">₹{b.security_deposit}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            isRefunded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            b.status === 'confirmed' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {isRefunded ? 'Refunded' : b.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(b.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          {isRefunded ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle className="h-3.5 w-3.5" /> Done</span>
                          ) : (
                            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={refunding === b.id} onClick={() => handleRefund(b)}>
                              {refunding === b.id ? 'Processing...' : 'Refund'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
