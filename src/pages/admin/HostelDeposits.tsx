
import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Wallet, Search, RefreshCw, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/currency';

const PAGE_SIZE = 15;

export default function HostelDeposits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'deposits' | 'refunds' | 'refunded' | null;
  const [activeTab, setActiveTab] = useState<'deposits' | 'refunds' | 'refunded'>(tabFromUrl || 'deposits');

  const handleTabChange = (value: string) => {
    const newTab = value as 'deposits' | 'refunds' | 'refunded';
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="mx-auto">
      <div className="mb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Admin Panel / Hostel Finance</p>
        <h1 className="text-lg font-semibold mt-0.5">Hostel Deposits & Refunds</h1>
        <p className="text-sm text-muted-foreground">Manage hostel security deposit collections and refunds</p>
      </div>
      <Tabs value={activeTab} className="space-y-4" onValueChange={handleTabChange}>
        <TabsList className="inline-flex h-9">
          <TabsTrigger value="deposits" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Deposits
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Refund Management
          </TabsTrigger>
          <TabsTrigger value="refunded" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Refunded
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deposits">
          <HostelDepositList />
        </TabsContent>
        <TabsContent value="refunds">
          <HostelRefundManagement status="pending" />
        </TabsContent>
        <TabsContent value="refunded">
          <HostelRefundManagement status="refunded" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Deposits Tab ──
function HostelDepositList() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => { fetchDeposits(); }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hostel_bookings')
        .select('*, hostels(name), hostel_rooms(room_number), hostel_beds(bed_number), profiles:user_id(name, email, phone)')
        .gt('security_deposit', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to fetch deposits', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return bookings;
    const s = searchTerm.toLowerCase();
    return bookings.filter(b =>
      b.serial_number?.toLowerCase().includes(s) ||
      b.profiles?.name?.toLowerCase().includes(s) ||
      b.hostels?.name?.toLowerCase().includes(s)
    );
  }, [bookings, searchTerm]);

  const totalDeposits = useMemo(() => filtered.reduce((s, b) => s + (b.security_deposit || 0), 0), [filtered]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Deposits</h1>
          <Badge variant="secondary" className="text-xs">{filtered.length} records</Badge>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={fetchDeposits}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="border rounded-md p-3 bg-card flex items-center gap-6">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Total Deposits</div>
          <div className="text-lg font-bold">{formatCurrency(totalDeposits)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Records</div>
          <div className="text-sm font-semibold">{filtered.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input className="h-8 pl-7 text-xs w-[200px]" placeholder="Search name, booking#..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearchTerm(''); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Booking ID</TableHead>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Hostel</TableHead>
              <TableHead className="text-xs">Room / Bed</TableHead>
              <TableHead className="text-xs">Deposit</TableHead>
              <TableHead className="text-xs">End Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">Loading...</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">No deposits found</TableCell></TableRow>
            ) : (
              paginated.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs font-mono">{b.serial_number || 'N/A'}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{b.profiles?.name || 'N/A'}</div>
                    {b.profiles?.phone && <div className="text-muted-foreground text-[10px]">{b.profiles.phone}</div>}
                  </TableCell>
                  <TableCell className="text-xs">{b.hostels?.name || 'N/A'}</TableCell>
                  <TableCell className="text-xs">R{b.hostel_rooms?.room_number || '-'} / B#{b.hostel_beds?.bed_number || '-'}</TableCell>
                  <TableCell className="text-xs font-semibold">{formatCurrency(b.security_deposit)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{b.end_date ? format(new Date(b.end_date), 'dd MMM yyyy') : '-'}</TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={b.status === 'confirmed' ? 'secondary' : 'outline'} className="text-[10px] capitalize">{b.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div>Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-3 w-3 mr-1" /> Prev
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Refund Management Tab ──
function HostelRefundManagement({ status }: { status: 'pending' | 'refunded' }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: allBookings, error } = await supabase
        .from('hostel_bookings')
        .select('*, hostels(name), hostel_rooms(room_number), hostel_beds(bed_number), profiles:user_id(name, email, phone)')
        .gt('security_deposit', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: refunds } = await supabase
        .from('hostel_receipts')
        .select('*')
        .eq('receipt_type', 'deposit_refund');

      const refundedBookingIds = new Set((refunds || []).map(r => r.booking_id).filter(Boolean));

      if (status === 'pending') {
        setBookings((allBookings || []).filter(b => !refundedBookingIds.has(b.id)));
      } else {
        const refundMap = Object.fromEntries((refunds || []).map(r => [r.booking_id, r]));
        setBookings((allBookings || []).filter(b => refundedBookingIds.has(b.id)).map(b => ({ ...b, refundReceipt: refundMap[b.id] })));
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return bookings;
    const s = searchTerm.toLowerCase();
    return bookings.filter(b =>
      b.serial_number?.toLowerCase().includes(s) ||
      b.profiles?.name?.toLowerCase().includes(s) ||
      b.hostels?.name?.toLowerCase().includes(s)
    );
  }, [bookings, searchTerm]);

  const totalDeposits = useMemo(() => filtered.reduce((s, b) => s + (b.security_deposit || b.refundReceipt?.amount || 0), 0), [filtered]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleProcessRefund = (booking: any) => {
    setSelectedBooking(booking);
    setRefundAmount(booking.security_deposit.toString());
    setShowRefundDialog(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedBooking) return;
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('hostel_receipts').insert({
        booking_id: selectedBooking.id,
        user_id: selectedBooking.user_id,
        hostel_id: selectedBooking.hostel_id,
        amount: parseFloat(refundAmount),
        payment_method: refundMethod || 'cash',
        receipt_type: 'deposit_refund',
        collected_by: user?.id,
        collected_by_name: user?.user_metadata?.name || '',
        notes: refundReason || `Security deposit refund for booking ${selectedBooking.serial_number || selectedBooking.id}`,
        transaction_id: transactionId || '',
      });
      if (error) throw error;
      await supabase.from('hostel_bookings').update({ security_deposit: 0 }).eq('id', selectedBooking.id);
      toast({ title: 'Success', description: 'Deposit refunded and receipt created' });
      resetForm();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to process refund', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setShowRefundDialog(false);
    setSelectedBooking(null);
    setRefundAmount('');
    setRefundReason('');
    setRefundMethod('');
    setTransactionId('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{status === 'pending' ? 'Refund Management' : 'Refunded'}</h1>
          <Badge variant="secondary" className="text-xs">{filtered.length} records</Badge>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={fetchData}>
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="border rounded-md p-3 bg-card flex items-center gap-6">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Total Deposits</div>
          <div className="text-lg font-bold">{formatCurrency(totalDeposits)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Records</div>
          <div className="text-sm font-semibold">{filtered.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input className="h-8 pl-7 text-xs w-[200px]" placeholder="Search name, booking#..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearchTerm(''); setPage(1); }}>
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Booking ID</TableHead>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Hostel</TableHead>
              <TableHead className="text-xs">Room / Bed</TableHead>
              <TableHead className="text-xs">Deposit</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              {status === 'pending' && <TableHead className="text-xs">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">Loading...</TableCell></TableRow>
            ) : paginated.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">No records found</TableCell></TableRow>
            ) : (
              paginated.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="text-xs">
                    <span className="font-mono">{b.serial_number || 'N/A'}</span>
                    {b.refundReceipt?.transaction_id && <div className="text-muted-foreground text-[10px]">TR: {b.refundReceipt.transaction_id}</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{b.profiles?.name || 'N/A'}</div>
                    {b.profiles?.phone && <div className="text-muted-foreground text-[10px]">{b.profiles.phone}</div>}
                  </TableCell>
                  <TableCell className="text-xs">{b.hostels?.name || 'N/A'}</TableCell>
                  <TableCell className="text-xs">R{b.hostel_rooms?.room_number || '-'} / B#{b.hostel_beds?.bed_number || '-'}</TableCell>
                  <TableCell className="text-xs font-semibold">{formatCurrency(b.security_deposit || b.refundReceipt?.amount || 0)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>End: {b.end_date ? format(new Date(b.end_date), 'dd MMM yyyy') : '-'}</div>
                    {b.refundReceipt?.created_at && <div>Refund: {format(new Date(b.refundReceipt.created_at), 'dd MMM yyyy')}</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={status === 'refunded' ? 'default' : 'secondary'} className="text-[10px]">
                      {status === 'refunded' ? 'Refunded' : 'Pending'}
                    </Badge>
                  </TableCell>
                  {status === 'pending' && (
                    <TableCell className="text-xs">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleProcessRefund(b)}>Refund</Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div>Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-3 w-3 mr-1" /> Prev
          </Button>
          <span>Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Refund Dialog - kept as-is */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Deposit Refund</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refundAmount" className="text-right">Amount</Label>
              <Input type="number" id="refundAmount" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} className="col-span-3" placeholder="Enter refund amount" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refundReason" className="text-right">Reason</Label>
              <Input type="text" id="refundReason" value={refundReason} onChange={e => setRefundReason(e.target.value)} className="col-span-3" placeholder="Refund reason" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refundMethod" className="text-right">Method</Label>
              <Select value={refundMethod} onValueChange={setRefundMethod}>
                <SelectTrigger className="col-span-3"><SelectValue placeholder="Select refund method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transactionId" className="text-right">Transaction ID</Label>
              <Input type="text" id="transactionId" value={transactionId} onChange={e => setTransactionId(e.target.value)} className="col-span-3" placeholder="Transaction ID" />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            <Button disabled={processing || !refundAmount} onClick={handleRefundSubmit}>
              {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <DollarSign className="mr-2 h-4 w-4" />}
              Process Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
