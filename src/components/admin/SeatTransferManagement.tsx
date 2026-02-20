
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div>
      <div className="mb-6">
        <p className="text-muted-foreground">
          Manage and track seat transfers with advanced filtering ({totalCount} transferable bookings)
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Booking ID, student name..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            
            {/* <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div> */}

            <div>
              <Label htmlFor="cabin">Reading Room</Label>
              <Select value={filters.cabin} onValueChange={(value) => handleFilterChange('cabin', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All reading rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reading Rooms</SelectItem>
                  {cabins.map((cabin) => (
                    <SelectItem key={cabin._id} value={cabin._id}>
                      {cabin.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="startDate">Start Date</SelectItem>
                  <SelectItem value="endDate">End Date</SelectItem>
                  <SelectItem value="totalPrice">Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
              <Select value={filters.order} onValueChange={(value) => handleFilterChange('order', value as 'asc' | 'desc')}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓</SelectItem>
                  <SelectItem value="asc">↑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportData('csv')} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => exportData('xlsx')} className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Transfer Requests (Page {currentPage} of {totalPages} - Showing {bookings.length} of {totalCount})
          </CardTitle>
          <CardDescription>Click on a booking to initiate transfer</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No transferable bookings found with the current filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">{booking.bookingId || booking._id}</Badge>
                      <Badge variant={booking.status === 'completed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="font-medium">{booking.userId.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.userId.email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span><strong>Reading Room:</strong> {booking.cabinId.name}</span>
                      <span><strong>Seat:</strong> {booking.seatId.number}</span>
                      <span><strong>Duration:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</span>
                      <span><strong>Amount:</strong> ₹{booking.totalPrice}</span>
                    </div>
                     {booking?.transferredHistory?.map((data, index) => (
                       data?.cabin  ? (
                        <div key={index}>
                          <p className="font-medium">
                            Transferred From : {data.cabin?.name || data.hostelId?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                              Room Code : {data.cabin?.cabinCode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Seat #{data.seat?.number}
                          </p>
                            <p className="text-sm text-muted-foreground">
                              Transferred By : {data.transferredBy?.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Transferred At : {format(new Date(data.transferredAt), 'dd MMM yyyy')}
                            </p>
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
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    })
                    .map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
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
