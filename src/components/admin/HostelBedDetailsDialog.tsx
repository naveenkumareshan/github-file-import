import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currency';

interface HostelBedDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bedId: string | null;
  bedNumber: number;
  hostelName?: string;
}

export function HostelBedDetailsDialog({ open, onOpenChange, bedId, bedNumber, hostelName }: HostelBedDetailsDialogProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !bedId) return;
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('hostel_bookings')
          .select('*, profiles:user_id(name, email, phone)')
          .eq('bed_id', bedId)
          .order('created_at', { ascending: false });
        setBookings(data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [open, bedId]);

  const exportData = () => {
    const csvContent = [
      ['Guest', 'Email', 'Phone', 'Start', 'End', 'Amount', 'Status'].join(','),
      ...bookings.map(b => [
        b.profiles?.name || '',
        b.profiles?.email || '',
        b.profiles?.phone || '',
        b.start_date,
        b.end_date,
        b.total_price,
        b.status,
      ].map(f => `"${f}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bed-${bedNumber}-bookings.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bed #{bedNumber} — Booking History {hostelName && <span className="text-muted-foreground text-sm font-normal ml-2">{hostelName}</span>}</DialogTitle>
          <DialogDescription>All bookings associated with this bed</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto mt-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : bookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No bookings found for this bed</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.profiles?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>{b.profiles?.phone || '-'}</div>
                        <div className="text-blue-600">{b.profiles?.email || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{b.start_date ? format(new Date(b.start_date), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell>{b.end_date ? format(new Date(b.end_date), 'dd MMM yyyy') : '-'}</TableCell>
                    <TableCell>
                      <div>Bed: {formatCurrency(b.total_price)}</div>
                      {(b.security_deposit || 0) > 0 && (
                        <div className="text-xs text-muted-foreground">Deposit: {formatCurrency(b.security_deposit)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'confirmed' ? 'default' : b.status === 'cancelled' ? 'destructive' : 'secondary'}>
                        {b.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {bookings.length > 0 && (
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={exportData}>Export Data</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
