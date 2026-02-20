
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Eye, Search, RefreshCw, Calendar } from 'lucide-react';

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'confirmed': case 'completed': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'pending': return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'cancelled': case 'expired': return 'bg-red-50 text-red-700 border border-red-200';
    default: return 'bg-muted text-muted-foreground border border-border';
  }
};

export default function AdminHostelBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [activeTab]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeTab !== 'all') params.status = activeTab;
      const response = await hostelService.getAllBookings(params);
      if (response.success) {
        setBookings(response.data);
      } else {
        toast({ title: "Error", description: "Failed to fetch bookings", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({ title: "Error", description: "Failed to fetch bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (bookingId: string) => {
    navigate(`/admin/hostel-bookings/${bookingId}`);
  };

  const filteredBookings = bookings.filter(booking => {
    if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (booking.bookingId?.toLowerCase().includes(searchLower)) ||
      (booking.userId?.name?.toLowerCase().includes(searchLower)) ||
      (booking.userId?.email?.toLowerCase().includes(searchLower)) ||
      (booking.hostelId?.name?.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <span>Admin Panel</span><span>/</span>
            <span className="text-foreground font-medium">Hostel Bookings</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Hostel Bookings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage all hostel bookings from students</p>
        </div>
        <Button onClick={fetchBookings} variant="outline" size="sm" className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>
      
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            
            {/* Filter Strip */}
            <div className="flex flex-col md:flex-row gap-3 mb-4 p-3 bg-muted/30 rounded-lg border border-border/40">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-sm w-full md:w-44">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Confirmed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                  <Calendar className="h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">No bookings found</p>
                  <p className="text-xs">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Booking ID</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Student</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Hostel</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Room/Bed</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Check-in</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Duration</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Status</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Payment</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking, idx) => (
                        <TableRow key={booking._id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <TableCell className="font-medium text-sm">
                            {booking.bookingId || '-'}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{booking.userId?.name || '-'}</p>
                            {booking.userId?.email && (
                              <p className="text-xs text-muted-foreground">{booking.userId.email}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {booking.hostelId?.name || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            Room {booking.bedId?.roomNumber || '-'}, Bed #{booking.bedId?.number || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {booking.startDate ? format(new Date(booking.startDate), 'dd MMM yyyy') : '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {booking.months} mo{booking.months !== 1 ? 's' : ''}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusBadgeClass(booking.paymentStatus)}`}>
                              {booking.paymentStatus}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleViewBooking(booking._id)}
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
