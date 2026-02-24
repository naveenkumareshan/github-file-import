import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, addDays, addMonths } from 'date-fns';
import { getImageUrl } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  LayoutGrid, List, CalendarIcon, Search, Ban, Lock, Unlock,
  Edit, Save, X, IndianRupee, Users, CheckCircle, Clock, AlertTriangle, RefreshCw, UserPlus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  vendorSeatsService, VendorSeat, VendorCabin, StudentProfile, PartnerBookingData,
} from '@/api/vendorSeatsService';
import { useVendorEmployeePermissions } from '@/hooks/useVendorEmployeePermissions';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'grid' | 'table';
type StatusFilter = 'all' | 'available' | 'booked' | 'expiring_soon' | 'blocked';

const VendorSeats: React.FC = () => {
  const [cabins, setCabins] = useState<VendorCabin[]>([]);
  const [seats, setSeats] = useState<VendorSeat[]>([]);
  const [selectedCabinId, setSelectedCabinId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<VendorSeat | null>(null);

  // Price edit
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [updating, setUpdating] = useState(false);

  // Booking form state
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [bookingPlan, setBookingPlan] = useState<string>('monthly');
  const [bookingStartDate, setBookingStartDate] = useState<Date>(new Date());
  const [customDays, setCustomDays] = useState('30');
  const [bookingPrice, setBookingPrice] = useState('');
  const [creatingBooking, setCreatingBooking] = useState(false);

  const { toast } = useToast();
  const { hasPermission } = useVendorEmployeePermissions();
  const { user } = useAuth();

  const canEdit = user?.role === 'admin' || user?.role === 'vendor' || hasPermission('seats_available_edit');

  // Fetch cabins on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await vendorSeatsService.getVendorCabins();
      if (res.success && res.data) {
        const c = res.data.data;
        setCabins(c);
        if (c.length > 0) setSelectedCabinId(c[0]._id);
      }
      setLoading(false);
    })();
  }, []);

  // Fetch seats when cabin or date changes
  const fetchSeats = useCallback(async () => {
    if (!selectedCabinId) return;
    setRefreshing(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const res = await vendorSeatsService.getSeatsForDate(selectedCabinId, dateStr);
    if (res.success && res.data) {
      setSeats(res.data);
    }
    setRefreshing(false);
  }, [selectedCabinId, selectedDate]);

  useEffect(() => { fetchSeats(); }, [fetchSeats]);

  // Computed filtered seats
  const filteredSeats = useMemo(() => {
    let result = seats;
    if (statusFilter !== 'all') {
      result = result.filter(s => s.dateStatus === statusFilter);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s => String(s.number).includes(q) || s.category.toLowerCase().includes(q));
    }
    return result;
  }, [seats, statusFilter, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = seats.length;
    const booked = seats.filter(s => s.dateStatus === 'booked').length;
    const available = seats.filter(s => s.dateStatus === 'available').length;
    const expiring = seats.filter(s => s.dateStatus === 'expiring_soon').length;
    const blocked = seats.filter(s => s.dateStatus === 'blocked').length;
    const revenue = seats.reduce((sum, s) => {
      if (s.dateStatus === 'booked' || s.dateStatus === 'expiring_soon') {
        const active = s.allBookings.find(b => b.startDate <= format(selectedDate, 'yyyy-MM-dd') && b.endDate >= format(selectedDate, 'yyyy-MM-dd'));
        return sum + (active?.totalPrice || 0);
      }
      return sum;
    }, 0);
    return { total, booked, available, expiring, blocked, revenue };
  }, [seats, selectedDate]);

  // Seat click -> open sheet
  const handleSeatClick = (seat: VendorSeat) => {
    setSelectedSeat(seat);
    setSheetOpen(true);
    setSelectedStudent(null);
    setStudentQuery('');
    setStudentResults([]);
    setBookingPlan('monthly');
    setBookingStartDate(selectedDate);
    setBookingPrice(String(seat.price));
    setCustomDays('30');
  };

  // Price edit
  const handleSavePrice = async (seatId: string) => {
    if (!editPrice) return;
    setUpdating(true);
    const res = await vendorSeatsService.updateSeatPrice(seatId, parseFloat(editPrice));
    if (res.success) {
      toast({ title: 'Price updated' });
      setEditingSeatId(null);
      fetchSeats();
    } else {
      toast({ title: 'Error', description: 'Failed to update price', variant: 'destructive' });
    }
    setUpdating(false);
  };

  // Toggle availability
  const handleToggleAvailability = async (seat: VendorSeat, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setUpdating(true);
    const res = await vendorSeatsService.toggleSeatAvailability(seat._id, !seat.isAvailable);
    if (res.success) {
      toast({ title: seat.isAvailable ? 'Seat blocked' : 'Seat unblocked' });
      fetchSeats();
    }
    setUpdating(false);
  };

  // Student search
  useEffect(() => {
    if (studentQuery.length < 2) { setStudentResults([]); return; }
    const timer = setTimeout(async () => {
      const res = await vendorSeatsService.searchStudents(studentQuery);
      if (res.success && res.data) setStudentResults(res.data);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentQuery]);

  // Compute end date
  const computedEndDate = useMemo(() => {
    if (bookingPlan === 'monthly') return addMonths(bookingStartDate, 1);
    if (bookingPlan === '15days') return addDays(bookingStartDate, 15);
    return addDays(bookingStartDate, parseInt(customDays) || 30);
  }, [bookingPlan, bookingStartDate, customDays]);

  // Create booking
  const handleCreateBooking = async () => {
    if (!selectedSeat || !selectedStudent) return;
    setCreatingBooking(true);
    const data: PartnerBookingData = {
      seatId: selectedSeat._id,
      cabinId: selectedSeat.cabinId,
      userId: selectedStudent.id,
      startDate: format(bookingStartDate, 'yyyy-MM-dd'),
      endDate: format(computedEndDate, 'yyyy-MM-dd'),
      totalPrice: parseFloat(bookingPrice) || selectedSeat.price,
      bookingDuration: bookingPlan === 'monthly' ? 'monthly' : bookingPlan === '15days' ? '15_days' : 'custom',
      durationCount: bookingPlan === 'custom' ? customDays : bookingPlan === '15days' ? '15' : '1',
      seatNumber: selectedSeat.number,
    };
    const res = await vendorSeatsService.createPartnerBooking(data);
    if (res.success) {
      toast({ title: 'Booking created successfully' });
      setSheetOpen(false);
      fetchSeats();
    } else {
      toast({ title: 'Error', description: res.error || 'Failed to create booking', variant: 'destructive' });
    }
    setCreatingBooking(false);
  };

  // Status colors
  const statusColors = (status?: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-50 border-emerald-400 dark:bg-emerald-950 dark:border-emerald-700';
      case 'booked': return 'bg-red-50 border-red-400 dark:bg-red-950 dark:border-red-700';
      case 'expiring_soon': return 'bg-amber-50 border-amber-400 dark:bg-amber-950 dark:border-amber-700';
      case 'blocked': return 'bg-muted border-muted-foreground/30';
      default: return 'bg-muted border-border';
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'booked': return 'Booked';
      case 'expiring_soon': return 'Expiring';
      case 'blocked': return 'Blocked';
      default: return '-';
    }
  };

  const statusIcon = (status?: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-3 w-3 text-emerald-600" />;
      case 'booked': return <Users className="h-3 w-3 text-red-600" />;
      case 'expiring_soon': return <AlertTriangle className="h-3 w-3 text-amber-600" />;
      case 'blocked': return <Ban className="h-3 w-3 text-muted-foreground" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* ──── Stats Bar ──── */}
      <div className="flex items-center gap-0 border rounded-md bg-card overflow-hidden h-[52px]">
        {[
          { label: 'Total', value: stats.total, icon: <LayoutGrid className="h-3.5 w-3.5 text-primary" /> },
          { label: 'Booked', value: stats.booked, icon: <Users className="h-3.5 w-3.5 text-red-500" /> },
          { label: 'Available', value: stats.available, icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> },
          { label: 'Expiring', value: stats.expiring, icon: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> },
          { label: 'Blocked', value: stats.blocked, icon: <Ban className="h-3.5 w-3.5 text-muted-foreground" /> },
          { label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: <IndianRupee className="h-3.5 w-3.5 text-primary" /> },
        ].map((s, i) => (
          <div key={s.label} className={cn("flex items-center gap-1.5 px-3 py-1 flex-1 justify-center", i > 0 && "border-l")}>
            {s.icon}
            <div className="text-center leading-tight">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
              <div className="text-sm font-semibold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ──── Sticky Filter Row ──── */}
      <div className="sticky top-0 z-10 bg-background border rounded-md px-2 py-1.5 flex items-center gap-2 flex-wrap">
        <Select value={selectedCabinId} onValueChange={setSelectedCabinId}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Reading Room" />
          </SelectTrigger>
          <SelectContent>
            {cabins.map(c => (
              <SelectItem key={c._id} value={c._id} className="text-xs">{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 px-2">
              <CalendarIcon className="h-3 w-3" />
              {format(selectedDate, 'dd MMM yyyy')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            <SelectItem value="available" className="text-xs">Available</SelectItem>
            <SelectItem value="booked" className="text-xs">Booked</SelectItem>
            <SelectItem value="expiring_soon" className="text-xs">Expiring Soon</SelectItem>
            <SelectItem value="blocked" className="text-xs">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[120px] max-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            className="h-8 text-xs pl-7"
            placeholder="Search seat..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center border rounded-md overflow-hidden ml-auto">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0 rounded-none"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 w-8 p-0 rounded-none"
            onClick={() => setViewMode('table')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={fetchSeats} disabled={refreshing}>
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
        </Button>
      </div>

      {/* ──── Legend ──── */}
      <div className="flex items-center gap-3 px-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Booked</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Expiring</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/40 inline-block" /> Blocked</span>
        <span className="ml-auto">{filteredSeats.length} seats</span>
      </div>

      {/* ──── Grid View ──── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1">
          {filteredSeats.map(seat => (
            <div
              key={seat._id}
              onClick={() => handleSeatClick(seat)}
              className={cn(
                "relative border rounded cursor-pointer p-1 flex flex-col items-center justify-center text-center transition-all hover:shadow-md group min-h-[72px]",
                statusColors(seat.dateStatus)
              )}
            >
              <span className="text-xs font-bold leading-none">S{seat.number}</span>
              <span className="text-[9px] text-muted-foreground leading-tight truncate w-full">{seat.category}</span>
              <span className="text-[9px] font-medium leading-tight">₹{seat.price}</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                {statusIcon(seat.dateStatus)}
                <span className="text-[8px]">{statusLabel(seat.dateStatus)}</span>
              </div>
              {/* Hover actions */}
              {canEdit && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => { e.stopPropagation(); handleToggleAvailability(seat, e); }}
                    title={seat.isAvailable ? 'Block' : 'Unblock'}
                  >
                    {seat.isAvailable ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSeatId(seat._id);
                      setEditPrice(String(seat.price));
                    }}
                    title="Edit price"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ──── Table View ──── */}
      {viewMode === 'table' && (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-[10px] uppercase tracking-wider h-8 px-2">Seat</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-8 px-2">Room</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-8 px-2">Category</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-8 px-2">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-8 px-2">Price</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider h-8 px-2">End Date</TableHead>
                {canEdit && <TableHead className="text-[10px] uppercase tracking-wider h-8 px-2">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSeats.map((seat, i) => {
                const activeBooking = seat.allBookings.find(b => b.startDate <= format(selectedDate, 'yyyy-MM-dd') && b.endDate >= format(selectedDate, 'yyyy-MM-dd'));
                return (
                  <TableRow
                    key={seat._id}
                    className={cn("cursor-pointer text-xs", i % 2 === 1 && "bg-muted/30")}
                    onClick={() => handleSeatClick(seat)}
                  >
                    <TableCell className="px-2 py-1 font-medium">S{seat.number}</TableCell>
                    <TableCell className="px-2 py-1">{seat.cabinName}</TableCell>
                    <TableCell className="px-2 py-1">
                      <Badge variant="outline" className="text-[10px] px-1 py-0">{seat.category}</Badge>
                    </TableCell>
                    <TableCell className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        {statusIcon(seat.dateStatus)}
                        <span className="text-[10px]">{statusLabel(seat.dateStatus)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1">₹{seat.price}</TableCell>
                    <TableCell className="px-2 py-1 text-[10px]">
                      {activeBooking ? new Date(activeBooking.endDate).toLocaleDateString() : '-'}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="px-2 py-1">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleToggleAvailability(seat, e); }}>
                            {seat.isAvailable ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setEditingSeatId(seat._id); setEditPrice(String(seat.price)); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {filteredSeats.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {selectedCabinId ? 'No seats match your filters.' : 'Select a Reading Room to begin.'}
        </div>
      )}

      {/* ──── Price Edit Dialog ──── */}
      <Dialog open={!!editingSeatId} onOpenChange={() => setEditingSeatId(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Seat Price</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">New Price (₹/month)</Label>
              <Input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => editingSeatId && handleSavePrice(editingSeatId)} disabled={updating}>
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingSeatId(null)}>
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──── Right-Side Sheet Drawer ──── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[440px] p-4 overflow-y-auto">
          {selectedSeat && (
            <>
              <SheetHeader className="pb-2">
                <SheetTitle className="text-sm flex items-center gap-2">
                  Seat #{selectedSeat.number}
                  <Badge variant="outline" className="text-[10px]">{selectedSeat.category}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">₹{selectedSeat.price}/mo</span>
                </SheetTitle>
              </SheetHeader>
              <Separator className="my-2" />

              {/* Seat status info */}
              <div className={cn("rounded p-2 mb-3 border text-xs", statusColors(selectedSeat.dateStatus))}>
                <div className="flex items-center gap-1.5">
                  {statusIcon(selectedSeat.dateStatus)}
                  <span className="font-medium">{statusLabel(selectedSeat.dateStatus)}</span>
                  <span className="text-muted-foreground ml-auto">for {format(selectedDate, 'dd MMM yyyy')}</span>
                </div>
              </div>

              {/* ── BOOKED / EXPIRING: Show student info ── */}
              {(selectedSeat.dateStatus === 'booked' || selectedSeat.dateStatus === 'expiring_soon') && selectedSeat.currentBooking && (
                <div className="space-y-3">
                  <div className="border rounded p-3 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Student</h4>
                    <div className="flex gap-3">
                      {selectedSeat.currentBooking.profilePicture && (
                        <a href={getImageUrl(selectedSeat.currentBooking.profilePicture)} target="_blank" rel="noopener noreferrer">
                          <img src={getImageUrl(selectedSeat.currentBooking.profilePicture)} alt="Student" className="w-12 h-14 object-cover rounded border" />
                        </a>
                      )}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] flex-1">
                        <div><span className="text-muted-foreground">Name:</span> {selectedSeat.currentBooking.studentName}</div>
                        <div><span className="text-muted-foreground">Phone:</span> {selectedSeat.currentBooking.studentPhone}</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Email:</span> {selectedSeat.currentBooking.studentEmail}</div>
                        <div><span className="text-muted-foreground">From:</span> {new Date(selectedSeat.currentBooking.startDate).toLocaleDateString()}</div>
                        <div><span className="text-muted-foreground">To:</span> {new Date(selectedSeat.currentBooking.endDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── AVAILABLE: Booking form ── */}
              {selectedSeat.dateStatus === 'available' && canEdit && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <UserPlus className="h-3 w-3" /> Book This Seat
                  </h4>

                  {/* Student search */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Search Student</Label>
                    <Input
                      className="h-8 text-xs"
                      placeholder="Name, phone, or email..."
                      value={studentQuery}
                      onChange={e => { setStudentQuery(e.target.value); setSelectedStudent(null); }}
                    />
                    {studentResults.length > 0 && !selectedStudent && (
                      <div className="border rounded mt-1 max-h-[150px] overflow-y-auto">
                        {studentResults.map(s => (
                          <div
                            key={s.id}
                            className="px-2 py-1.5 text-[11px] hover:bg-muted cursor-pointer border-b last:border-0"
                            onClick={() => { setSelectedStudent(s); setStudentQuery(s.name); setStudentResults([]); }}
                          >
                            <div className="font-medium">{s.name}</div>
                            <div className="text-muted-foreground">{s.phone} · {s.email}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedStudent && (
                      <div className="mt-1 border rounded p-2 bg-muted/50 text-[11px] flex justify-between items-center">
                        <div>
                          <span className="font-medium">{selectedStudent.name}</span>
                          <span className="text-muted-foreground ml-2">{selectedStudent.phone}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { setSelectedStudent(null); setStudentQuery(''); }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Plan */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Plan</Label>
                    <Select value={bookingPlan} onValueChange={setBookingPlan}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly" className="text-xs">Monthly (30 days)</SelectItem>
                        <SelectItem value="15days" className="text-xs">15 Days</SelectItem>
                        <SelectItem value="custom" className="text-xs">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bookingPlan === 'custom' && (
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Days</Label>
                      <Input className="h-8 text-xs" type="number" value={customDays} onChange={e => setCustomDays(e.target.value)} />
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Start</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 text-xs w-full justify-start gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {format(bookingStartDate, 'dd MMM')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={bookingStartDate} onSelect={d => d && setBookingStartDate(d)} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">End</Label>
                      <div className="h-8 border rounded-md flex items-center px-2 text-xs bg-muted/50">
                        {format(computedEndDate, 'dd MMM yyyy')}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Amount (₹)</Label>
                    <Input className="h-8 text-xs" type="number" value={bookingPrice} onChange={e => setBookingPrice(e.target.value)} />
                  </div>

                  <Button
                    className="w-full h-9 text-xs"
                    disabled={!selectedStudent || creatingBooking}
                    onClick={handleCreateBooking}
                  >
                    {creatingBooking ? 'Creating...' : 'Confirm Booking'}
                  </Button>
                </div>
              )}

              {/* ── BLOCKED: Unblock option ── */}
              {selectedSeat.dateStatus === 'blocked' && canEdit && (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground mb-3">This seat is currently blocked.</p>
                  <Button size="sm" variant="outline" onClick={() => handleToggleAvailability(selectedSeat)}>
                    <Unlock className="h-3 w-3 mr-1" /> Unblock Seat
                  </Button>
                </div>
              )}

              {/* ── All Bookings History ── */}
              <Separator className="my-3" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Booking History ({selectedSeat.allBookings.length})
              </h4>
              {selectedSeat.allBookings.length > 0 ? (
                <div className="space-y-2">
                  {selectedSeat.allBookings.map((b, i) => (
                    <div key={i} className="border rounded p-2 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{b.studentName}</span>
                        <Badge variant="outline" className="text-[9px] px-1">{b.paymentStatus}</Badge>
                      </div>
                      <div className="text-muted-foreground">
                        {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                        {b.durationCount && b.bookingDuration && ` · ${b.durationCount} ${b.bookingDuration}`}
                      </div>
                      <div className="flex justify-between">
                        <span>₹{b.totalPrice}</span>
                        <span className="text-muted-foreground">{b.studentPhone}</span>
                      </div>
                      {(b.course || b.college) && (
                        <div className="text-muted-foreground">{b.course}{b.course && b.college ? ' · ' : ''}{b.college}</div>
                      )}
                      {b.serialNumber && <div className="text-muted-foreground">#{b.serialNumber}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground">No bookings for this seat.</p>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default VendorSeats;
