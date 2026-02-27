
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Wallet, Search, Filter, RefreshCw, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const PAGE_SIZE = 10;

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

  useEffect(() => { fetchDeposits(); }, [page]);

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

  const filtered = bookings.filter(b => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      b.serial_number?.toLowerCase().includes(s) ||
      b.profiles?.name?.toLowerCase().includes(s) ||
      b.hostels?.name?.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-xs text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Search</Label>
              <Input placeholder="Search by booking ID or student name" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={fetchDeposits}>
            <Filter className="mr-2 h-3 w-3" /> Apply
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Booking ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hostel</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Room / Bed</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Deposit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-muted-foreground">Loading...</td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-muted-foreground">No deposits found.</td></tr>
                  ) : (
                    paginated.map((b, idx) => (
                      <tr key={b.id} className={`hover:bg-muted/30 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className="font-mono text-xs">{b.serial_number || 'N/A'}</span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <div className="font-medium">{b.profiles?.name || 'N/A'}</div>
                          {b.profiles?.email && <div className="text-xs text-muted-foreground">{b.profiles.email}</div>}
                          {b.profiles?.phone && <div className="text-xs text-muted-foreground">{b.profiles.phone}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{b.hostels?.name || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">Room {b.hostel_rooms?.room_number || '-'} / Bed #{b.hostel_beds?.bed_number || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold">₹{b.security_deposit}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          <div>End: {b.end_date ? format(new Date(b.end_date), 'dd MMM yyyy') : '-'}</div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                            b.status === 'confirmed' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 px-4 pb-4">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Refund Management Tab ──
function HostelRefundManagement({ status }: { status: 'pending' | 'refunded' }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [refundReceipts, setRefundReceipts] = useState<any[]>([]);
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

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get all bookings with deposits
      const { data: allBookings, error } = await supabase
        .from('hostel_bookings')
        .select('*, hostels(name), hostel_rooms(room_number), hostel_beds(bed_number), profiles:user_id(name, email, phone)')
        .gt('security_deposit', 0)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get all deposit refund receipts
      const { data: refunds } = await supabase
        .from('hostel_receipts')
        .select('*')
        .eq('receipt_type', 'deposit_refund');
      
      const refundedBookingIds = new Set((refunds || []).map(r => r.booking_id).filter(Boolean));
      setRefundReceipts(refunds || []);

      if (status === 'pending') {
        setBookings((allBookings || []).filter(b => !refundedBookingIds.has(b.id)));
      } else {
        // For refunded tab, show bookings that have been refunded
        const refundedBookings = (allBookings || []).filter(b => refundedBookingIds.has(b.id));
        // Attach refund receipt data
        const refundMap = Object.fromEntries((refunds || []).map(r => [r.booking_id, r]));
        setBookings(refundedBookings.map(b => ({ ...b, refundReceipt: refundMap[b.id] })));
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = bookings.filter(b => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      b.serial_number?.toLowerCase().includes(s) ||
      b.profiles?.name?.toLowerCase().includes(s) ||
      b.hostels?.name?.toLowerCase().includes(s)
    );
  });

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

      // Mark deposit as refunded by setting to 0
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-xs text-muted-foreground">{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Search</Label>
              <Input placeholder="Search by booking ID or user name" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <Button size="sm" onClick={fetchData}>
              <Filter className="mr-2 h-3 w-3" /> Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Booking ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hostel</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Room / Bed</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Deposit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    {status === 'pending' && <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={8} className="px-3 py-4 text-center text-sm text-muted-foreground">Loading...</td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-4 text-center text-sm text-muted-foreground">No records found.</td></tr>
                  ) : (
                    paginated.map((b, idx) => (
                      <tr key={b.id} className={`hover:bg-muted/30 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className="font-mono text-xs">{b.serial_number || 'N/A'}</span>
                          {b.refundReceipt?.transaction_id && <div className="text-xs text-muted-foreground">TR: {b.refundReceipt.transaction_id}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <div className="font-medium">{b.profiles?.name || 'N/A'}</div>
                          {b.profiles?.email && <div className="text-xs text-muted-foreground">{b.profiles.email}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{b.hostels?.name || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">Room {b.hostel_rooms?.room_number || '-'} / Bed #{b.hostel_beds?.bed_number || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold">₹{b.security_deposit || b.refundReceipt?.amount || 0}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          <div>End: {b.end_date ? format(new Date(b.end_date), 'dd MMM yyyy') : '-'}</div>
                          {b.refundReceipt?.created_at && <div>Refund: {format(new Date(b.refundReceipt.created_at), 'dd MMM yyyy')}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            status === 'refunded' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {status === 'refunded' ? 'Refunded' : 'Pending'}
                          </span>
                        </td>
                        {status === 'pending' && (
                          <td className="px-3 py-2 whitespace-nowrap">
                            <Button size="sm" variant="outline" onClick={() => handleProcessRefund(b)}>Refund</Button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 px-4 pb-4">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refund Dialog */}
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
