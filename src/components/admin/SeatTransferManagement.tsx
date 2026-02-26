
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { adminBookingsService } from '@/api/adminBookingsService';
import { adminSeatsService } from '@/api/adminSeatsService';
import { adminCabinsService } from '@/api/adminCabinsService';
import { ArrowRight, Filter, Download, FileSpreadsheet } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from 'date-fns';
import { VendorCabin } from '@/api/vendorSeatsService';

interface Booking {
  _id: string;
  bookingId: string;
  userId: { name: string; email: string };
  cabinId: { _id: string; name: string };
  seatId: { _id: string; number: number };
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  transferredHistory:any;
}

interface Cabin {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  category?: "standard" | "premium" | "luxury";
  amenities?: string[];
  floors?: {id: string, number: number}[];
  lockerPrice?:number;
  isActive?:boolean;
  isBookingActive?:boolean;
}

interface Seat {
  _id: string;
  number: number;
  isAvailable: boolean;
  price: number;
}

interface FilterState {
  status: string;
  search: string;
  startDate: string;
  endDate: string;
  cabin: string;
  sortBy: string;
  order: 'asc' | 'desc';
}

export default function SeatTransferManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [targetCabin, setTargetCabin] = useState<Cabin | null>(null);
  const [availableSeats, setAvailableSeats] = useState<Seat[]>([]);
  const [targetSeat, setTargetSeat] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const [selectedfloor, setSelectedFloor] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'completed',
    search: '',
    startDate: '',
    endDate: '',
    cabin: '',
    sortBy: 'createdAt',
    order: 'desc'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCabins();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [currentPage, filters]);

  const loadCabins = async () => {
    try {
      const response = await adminCabinsService.getAllCabins();
      if (response.success) {
        setCabins(response.data || []);
      }
    } catch (error) {
      console.error('Error loading cabins:', error);
    }
  };

  const loadBookings = async () => {
    setLoading(true);
    try {
      // Prepare filters for API call
      const apiFilters: any = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: filters.sortBy,
        order: filters.order
      };

      // Add filters only if they have values
      if (filters.status) apiFilters.status = filters.status;
      if (filters.search) apiFilters.search = filters.search;
      if (filters.startDate) apiFilters.startDate = filters.startDate;
      if (filters.endDate) apiFilters.endDate = filters.endDate;
      if (filters.cabin) apiFilters.cabinId = filters.cabin;

      if(filters.cabin){
        if(filters.cabin == 'all'){
            apiFilters.cabinId = '';
        }
      }
      // if(filters.status){
        // if(filters.status == 'all'){
            apiFilters.status = 'completed';
        // }
      // }
      const response = await adminBookingsService.getAllBookings(apiFilters);
      
      if (response.success) {
        // Filter for only completed bookings with seats (transferable bookings)
        const transferableBookings = (response.data || []).filter((booking: Booking) => 
          booking.status === 'completed' && booking.seatId
        );
        setBookings(transferableBookings);
        setTotalCount(response.totalDocs);
        // setTotalPages(Math.ceil(transferableBookings.length / itemsPerPage));
        setTotalPages(Math.ceil(response.totalPages));

      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSeats = async (cabinId: string, selectedfloor: string) => {
    try {
      const response = await adminSeatsService.getSeatsByCabin(cabinId, selectedfloor);
      if (response.success) {
        const availableSeats = response.data.filter((seat: Seat) => seat.isAvailable);
        setAvailableSeats(availableSeats);
      }
    } catch (error) {
      console.error('Error loading seats:', error);
      toast({
        title: "Error",
        description: "Failed to load available seats",
        variant: "destructive"
      });
    }
  };

  const handleCabinChange = (cabinId: string) => {
    const selectedCabin = cabins.find(c => c._id === cabinId) || null;
    setTargetCabin(selectedCabin);   
    setTargetSeat('');
    setSelectedFloor('')
  };
  
  const handleFloorChange = (floorNumber: string) => {
    setSelectedFloor(floorNumber);   
    setTargetSeat('');
    if (selectedfloor) {
      // loadAvailableSeats(targetCabin._id, selectedfloor);
    } else {
      setAvailableSeats([]);
    }
  };

  useEffect(() => {
    if (targetCabin && selectedfloor) {
      loadAvailableSeats(targetCabin._id, selectedfloor);
    } 
  }, [targetCabin, selectedfloor]);

  const handleTransfer = async () => {
    if (!selectedBooking || !targetCabin || !targetSeat) {
      toast({
        title: "Error",
        description: "Please select target reading room and seat",
        variant: "destructive"
      });
      return;
    }

    setIsTransferring(true);
    try {
      const updateData = {
        cabinId: targetCabin._id,
        seatId: targetSeat
      };

      const response = await adminBookingsService.updateTransferBooking(selectedBooking._id, updateData);
      
      if (response.success) {
        // Mark old seat as available and new seat as occupied
        await Promise.all([
          adminSeatsService.updateSeat(selectedBooking.seatId._id, { isAvailable: true }),
          adminSeatsService.updateSeat(targetSeat, { isAvailable: false })
        ]);

        toast({
          title: "Transfer Successful",
          description: `Booking transferred successfully to new seat`
        });
        
        setIsDialogOpen(false);
        setSelectedBooking(null);
        setTargetCabin(null);
        setTargetSeat('');
        loadBookings(); // Refresh the list
      } else {
        throw new Error(response.error || 'Transfer failed');
      }
    } catch (error) {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer seat",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const exportData = async (format: 'csv' | 'xlsx') => {
    try {
      // Get all data for export
      const exportFilters: any = { limit: 1000 };
      
      if (filters.status) exportFilters.status = filters.status;
      if (filters.search) exportFilters.search = filters.search;
      if (filters.startDate) exportFilters.startDate = filters.startDate;
      if (filters.endDate) exportFilters.endDate = filters.endDate;
      if (filters.cabin) exportFilters.cabinId = filters.cabin;

      const response = await adminBookingsService.getAllBookings(exportFilters);
      
      if (!response.success) {
        throw new Error(response.error);
      }

      const transferableBookings = (response.data || []).filter((booking: Booking) => 
        booking.status === 'completed' && booking.seatId
      );

      const csvContent = [
        ['Booking ID', 'Student Name', 'Email', 'Reading Room', 'Seat', 'Start Date', 'End Date', 'Status', 'Amount'].join(','),
        ...transferableBookings.map((booking: Booking) => [
          booking.bookingId || booking._id,
          booking.userId.name,
          booking.userId.email,
          booking.cabinId.name,
          booking.seatId.number,
          new Date(booking.startDate).toLocaleDateString(),
          new Date(booking.endDate).toLocaleDateString(),
          booking.status,
          booking.totalPrice
        ].map(field => `"${field}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seat-transfers-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${transferableBookings.length} records exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: 'completed',
      search: '',
      startDate: '',
      endDate: '',
      cabin: '',
      sortBy: 'createdAt',
      order: 'desc'
    });
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border border-border/60 rounded-xl shadow-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search booking ID, name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="h-8 text-sm w-48"
            />
            <Select value={filters.cabin} onValueChange={(value) => handleFilterChange('cabin', value)}>
              <SelectTrigger className="h-8 text-sm w-40">
                <SelectValue placeholder="All rooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reading Rooms</SelectItem>
                {cabins.map((cabin) => (
                  <SelectItem key={cabin._id} value={cabin._id}>{cabin.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger className="h-8 text-sm w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="startDate">Start Date</SelectItem>
                <SelectItem value="endDate">End Date</SelectItem>
                <SelectItem value="totalPrice">Amount</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.order} onValueChange={(value) => handleFilterChange('order', value as 'asc' | 'desc')}>
              <SelectTrigger className="w-16 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">↓</SelectItem>
                <SelectItem value="asc">↑</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="h-8 text-sm w-36" />
            <Input type="date" value={filters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="h-8 text-sm w-36" />
            <Button variant="outline" size="sm" onClick={clearFilters} className="h-8">Clear</Button>
            <Button variant="outline" size="sm" onClick={() => exportData('csv')} className="h-8 flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('xlsx')} className="h-8 flex items-center gap-1">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card className="border border-border/60 rounded-xl shadow-sm">
        <div className="flex items-center justify-between py-3 px-4 border-b">
          <span className="text-sm font-medium text-foreground">Active Bookings</span>
          <span className="text-xs text-muted-foreground">{bookings.length} of {totalCount} · Page {currentPage}/{totalPages}</span>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <ArrowRight className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-foreground">No transferable bookings</p>
              <p className="text-xs text-muted-foreground mt-1">No completed seat bookings found with the current filters</p>
            </div>
          ) : (
            <div className="divide-y">
              {bookings.map((booking) => (
                <div key={booking._id} className="flex items-start justify-between p-4 hover:bg-muted/30 border-l-2 border-primary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{booking.bookingId || booking._id?.slice(-8)}</span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{booking.userId.name}</p>
                    {(booking.userId as any).phone && <p className="text-xs text-muted-foreground">{(booking.userId as any).phone}</p>}
                    <p className="text-xs text-muted-foreground">{booking.userId.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground border border-border/60">{booking.cabinId.name}</span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground border border-border/60">Seat {booking.seatId.number}</span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground border border-border/60">{new Date(booking.startDate).toLocaleDateString()} – {new Date(booking.endDate).toLocaleDateString()}</span>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground border border-border/60">₹{booking.totalPrice}</span>
                    </div>
                    {booking?.transferredHistory?.map((data, index) => (
                      data?.cabin ? (
                        <div key={index} className="mt-2 bg-muted/30 rounded px-3 py-1.5 text-xs space-y-0.5">
                          <p className="text-muted-foreground">From: <span className="text-foreground font-medium">{data.cabin?.name || data.hostelId?.name}</span> · Seat #{data.seat?.number}</p>
                          <p className="text-muted-foreground">By: {data.transferredBy?.name} · {format(new Date(data.transferredAt), 'dd MMM yyyy')}</p>
                        </div>
                      ) : null
                    ))}
                  </div>
                  
                  <Dialog open={isDialogOpen && selectedBooking?._id === booking._id} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Transfer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Transfer Seat</DialogTitle>
                        <DialogDescription>
                          Transfer booking {booking.bookingId || booking._id} to a different seat
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm"><strong>Current:</strong> {booking.cabinId.name} - Seat {booking.seatId.number}</p>
                          <p className="text-sm"><strong>Student:</strong> {booking.userId.name}</p>
                        </div>
                        
                        <div className="space-y-2">
                        <Label htmlFor="target-cabin">Target Reading Room</Label>
                          <Select value={targetCabin?._id} onValueChange={handleCabinChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target reading room" />
                            </SelectTrigger>
                            <SelectContent>
                              {cabins.map((cabin) => (
                                <SelectItem key={cabin._id} value={cabin._id}>
                                  {cabin.name} ({cabin.category})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {targetCabin && (
                          <div className="space-y-2">
                            <Label htmlFor="target-seat">Select Floor</Label>
                            <Select value={selectedfloor} onValueChange={handleFloorChange}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select available seat" />
                              </SelectTrigger>
                              <SelectContent>
                                {targetCabin.floors.map((seat) => (
                                  <SelectItem key={seat.id} value={seat.id}>
                                    Floor {seat.number}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {availableSeats.length === 0 && (
                              <p className="text-sm text-muted-foreground">No available seats in this cabin</p>
                            )}
                          </div>
                        )}

                        {targetCabin && selectedfloor && (
                          <div className="space-y-2">
                            <Label htmlFor="target-seat">Available Seats</Label>
                            <Select value={targetSeat} onValueChange={setTargetSeat}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select available seat" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableSeats.map((seat) => (
                                  <SelectItem key={seat._id} value={seat._id}>
                                    Seat {seat.number} - ₹{seat.price}/month
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {availableSeats.length === 0 && (
                              <p className="text-sm text-muted-foreground">No available seats in this cabin</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <DialogFooter>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isTransferring}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleTransfer}
                          disabled={!targetCabin || !targetSeat || isTransferring}
                        >
                          {isTransferring ? "Transferring..." : "Transfer Seat"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 px-4 pb-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink onClick={() => setCurrentPage(page)} isActive={page === currentPage} className="cursor-pointer">
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
