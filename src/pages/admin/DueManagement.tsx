import React, { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, isPast } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wallet, AlertTriangle, IndianRupee, Calendar, Search, Banknote, Smartphone, Building2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { vendorSeatsService, VendorCabin } from '@/api/vendorSeatsService';
import { Textarea } from '@/components/ui/textarea';

const DueManagement: React.FC = () => {
  const [dues, setDues] = useState<any[]>([]);
  const [cabins, setCabins] = useState<VendorCabin[]>([]);
  const [summary, setSummary] = useState({ totalDue: 0, overdue: 0, dueToday: 0, collectedThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [filterCabin, setFilterCabin] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Collect drawer
  const [collectOpen, setCollectOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<any>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMethod, setCollectMethod] = useState('cash');
  const [collectTxnId, setCollectTxnId] = useState('');
  const [collectNotes, setCollectNotes] = useState('');
  const [collecting, setCollecting] = useState(false);

  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    const [duesRes, summaryRes, cabinsRes] = await Promise.all([
      vendorSeatsService.getAllDues({ cabinId: filterCabin, status: filterStatus, search: searchTerm }),
      vendorSeatsService.getDueSummary(),
      vendorSeatsService.getVendorCabins(),
    ]);
    if (duesRes.success) setDues(duesRes.data);
    if (summaryRes.success) setSummary(summaryRes.data);
    if (cabinsRes.success && cabinsRes.data) setCabins(cabinsRes.data.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filterCabin, filterStatus]);

  const handleSearch = () => fetchData();

  const getStatusBadge = (due: any) => {
    const today = new Date().toISOString().split('T')[0];
    const remaining = Number(due.due_amount) - Number(due.paid_amount);
    if (due.status === 'paid' || remaining <= 0) return <Badge className="bg-emerald-500 text-white text-[10px]">Paid</Badge>;
    if (due.status === 'partially_paid') return <Badge className="bg-orange-500 text-white text-[10px]">Partial</Badge>;
    if (due.due_date < today) return <Badge className="bg-red-500 text-white text-[10px]">Overdue</Badge>;
    return <Badge className="bg-amber-500 text-white text-[10px]">Pending</Badge>;
  };

  const getDaysInfo = (due: any) => {
    const today = new Date();
    const dueDate = new Date(due.due_date);
    const diff = differenceInDays(dueDate, today);
    if (due.status === 'paid') return <span className="text-emerald-600 text-[11px]">Paid</span>;
    if (diff < 0) return <span className="text-red-600 font-semibold text-[11px]">{Math.abs(diff)}d overdue</span>;
    if (diff === 0) return <span className="text-amber-600 font-semibold text-[11px]">Due today</span>;
    return <span className="text-muted-foreground text-[11px]">{diff}d left</span>;
  };

  const openCollect = (due: any) => {
    setSelectedDue(due);
    const remaining = Number(due.due_amount) - Number(due.paid_amount);
    setCollectAmount(String(remaining > 0 ? remaining : 0));
    setCollectMethod('cash');
    setCollectTxnId('');
    setCollectNotes('');
    setCollectOpen(true);
  };

  const handleCollect = async () => {
    if (!selectedDue || !collectAmount) return;
    const amt = parseFloat(collectAmount);
    if (amt <= 0) { toast({ title: 'Enter a valid amount', variant: 'destructive' }); return; }
    setCollecting(true);
    const res = await vendorSeatsService.collectDuePayment(selectedDue.id, amt, collectMethod, collectTxnId, collectNotes);
    if (res.success) {
      toast({ title: 'Payment collected successfully' });
      setCollectOpen(false);
      fetchData();
    } else {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
    }
    setCollecting(false);
  };

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Due Management</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card><CardContent className="p-3 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-red-500" />
          <div><p className="text-[10px] text-muted-foreground uppercase">Total Due</p><p className="text-sm font-bold">₹{summary.totalDue.toLocaleString()}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div><p className="text-[10px] text-muted-foreground uppercase">Overdue</p><p className="text-sm font-bold text-red-600">₹{summary.overdue.toLocaleString()}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-amber-500" />
          <div><p className="text-[10px] text-muted-foreground uppercase">Due Today</p><p className="text-sm font-bold">₹{summary.dueToday.toLocaleString()}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-3 flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-emerald-500" />
          <div><p className="text-[10px] text-muted-foreground uppercase">Collected (Month)</p><p className="text-sm font-bold text-emerald-600">₹{summary.collectedThisMonth.toLocaleString()}</p></div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="w-40">
          <Select value={filterCabin} onValueChange={setFilterCabin}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Reading Room" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Rooms</SelectItem>
              {cabins.map(c => <SelectItem key={c._id} value={c._id} className="text-xs">{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Status</SelectItem>
              <SelectItem value="pending" className="text-xs">Pending</SelectItem>
              <SelectItem value="partially_paid" className="text-xs">Partially Paid</SelectItem>
              <SelectItem value="paid" className="text-xs">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input className="h-8 text-xs pl-7" placeholder="Search student name/phone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={handleSearch}>Search</Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>
          ) : dues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No dues found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px]">
                    <TableHead className="text-[10px]">Student</TableHead>
                    <TableHead className="text-[10px]">Room / Seat</TableHead>
                    <TableHead className="text-[10px]">Booking</TableHead>
                    <TableHead className="text-[10px] text-right">Total</TableHead>
                    <TableHead className="text-[10px] text-right">Paid</TableHead>
                    <TableHead className="text-[10px] text-right">Due</TableHead>
                    <TableHead className="text-[10px]">Due Date</TableHead>
                    <TableHead className="text-[10px]">Seat Valid</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dues.map((due: any) => {
                    const remaining = Number(due.due_amount) - Number(due.paid_amount);
                    return (
                      <TableRow key={due.id} className="text-[11px]">
                        <TableCell className="py-2">
                          <div className="font-medium text-[11px]">{(due.profiles as any)?.name || 'N/A'}</div>
                          <div className="text-[10px] text-muted-foreground">{(due.profiles as any)?.phone || ''}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-[11px]">{(due.cabins as any)?.name || ''}</div>
                          <div className="text-[10px] text-muted-foreground">Seat #{(due.seats as any)?.number || ''}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-[10px] text-muted-foreground">{(due.bookings as any)?.serial_number || '-'}</div>
                        </TableCell>
                        <TableCell className="py-2 text-right font-medium">₹{Number(due.total_fee).toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-right text-emerald-600">₹{(Number(due.advance_paid) + Number(due.paid_amount)).toLocaleString()}</TableCell>
                        <TableCell className="py-2 text-right text-red-600 font-medium">₹{Math.max(0, remaining).toLocaleString()}</TableCell>
                        <TableCell className="py-2">
                          <div className="text-[11px]">{due.due_date ? format(new Date(due.due_date), 'dd MMM yy') : '-'}</div>
                          {getDaysInfo(due)}
                        </TableCell>
                        <TableCell className="py-2 text-[11px]">
                          {due.proportional_end_date ? format(new Date(due.proportional_end_date), 'dd MMM yy') : '-'}
                        </TableCell>
                        <TableCell className="py-2">{getStatusBadge(due)}</TableCell>
                        <TableCell className="py-2">
                          {remaining > 0 && (
                            <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => openCollect(due)}>
                              Collect
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

      {/* Collect Payment Drawer */}
      <Sheet open={collectOpen} onOpenChange={setCollectOpen}>
        <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-sm">Collect Due Payment</SheetTitle>
          </SheetHeader>
          {selectedDue && (
            <div className="space-y-4 mt-4">
              <div className="bg-muted/50 rounded p-3 space-y-1 text-[11px]">
                <div className="font-semibold text-sm">{(selectedDue.profiles as any)?.name}</div>
                <div className="text-muted-foreground">{(selectedDue.profiles as any)?.phone}</div>
                <Separator className="my-2" />
                <div className="flex justify-between"><span>Total Fee</span><span className="font-medium">₹{Number(selectedDue.total_fee).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Advance Paid</span><span>₹{Number(selectedDue.advance_paid).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Collected So Far</span><span className="text-emerald-600">₹{Number(selectedDue.paid_amount).toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold text-red-600"><span>Remaining Due</span><span>₹{Math.max(0, Number(selectedDue.due_amount) - Number(selectedDue.paid_amount)).toLocaleString()}</span></div>
              </div>

              <div>
                <Label className="text-xs">Amount to Collect (₹)</Label>
                <Input type="number" className="h-8 text-xs" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} />
              </div>

              <div>
                <Label className="text-xs">Payment Method</Label>
                <RadioGroup value={collectMethod} onValueChange={setCollectMethod} className="grid grid-cols-2 gap-1.5 mt-1">
                  <div className="flex items-center gap-1.5 border rounded p-1.5">
                    <RadioGroupItem value="cash" id="dc_cash" className="h-3 w-3" />
                    <Label htmlFor="dc_cash" className="text-[10px] cursor-pointer flex items-center gap-1"><Banknote className="h-3 w-3" /> Cash</Label>
                  </div>
                  <div className="flex items-center gap-1.5 border rounded p-1.5">
                    <RadioGroupItem value="upi" id="dc_upi" className="h-3 w-3" />
                    <Label htmlFor="dc_upi" className="text-[10px] cursor-pointer flex items-center gap-1"><Smartphone className="h-3 w-3" /> UPI</Label>
                  </div>
                  <div className="flex items-center gap-1.5 border rounded p-1.5">
                    <RadioGroupItem value="bank_transfer" id="dc_bank" className="h-3 w-3" />
                    <Label htmlFor="dc_bank" className="text-[10px] cursor-pointer flex items-center gap-1"><Building2 className="h-3 w-3" /> Bank</Label>
                  </div>
                  <div className="flex items-center gap-1.5 border rounded p-1.5">
                    <RadioGroupItem value="online" id="dc_online" className="h-3 w-3" />
                    <Label htmlFor="dc_online" className="text-[10px] cursor-pointer flex items-center gap-1"><CreditCard className="h-3 w-3" /> Online</Label>
                  </div>
                </RadioGroup>
              </div>

              {(collectMethod === 'upi' || collectMethod === 'bank_transfer') && (
                <div>
                  <Label className="text-xs">Transaction ID</Label>
                  <Input className="h-8 text-xs" value={collectTxnId} onChange={e => setCollectTxnId(e.target.value)} />
                </div>
              )}

              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea className="text-xs h-16" value={collectNotes} onChange={e => setCollectNotes(e.target.value)} />
              </div>

              <Button className="w-full h-9 text-xs" onClick={handleCollect} disabled={collecting || !collectAmount}>
                {collecting ? 'Processing...' : `Confirm Collection · ₹${collectAmount}`}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DueManagement;
