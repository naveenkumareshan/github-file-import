
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Eye, Search } from 'lucide-react';

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
      
      if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      const response = await hostelService.getAllBookings(params);
      
      if (response.success) {
        setBookings(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch bookings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string, paymentStatus: string) => {
    if (status === 'completed' || paymentStatus === 'completed') return "default";
    if (status === 'cancelled') return "destructive";
    if (status === 'expired') return "outline";
    return "secondary";
  };

  const handleViewBooking = (bookingId: string) => {
    navigate(`/admin/hostel-bookings/${bookingId}`);
  };

  const filteredBookings = bookings.filter(booking => {
    // Status filter
    if (statusFilter !== 'all' && booking.status !== statusFilter) {
      return false;
    }
    
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (booking.bookingId?.toLowerCase().includes(searchLower)) ||
      (booking.userId?.name?.toLowerCase().includes(searchLower)) ||
      (booking.userId?.email?.toLowerCase().includes(searchLower)) ||
      (booking.hostelId?.name?.toLowerCase().includes(searchLower));
    
    return matchesSearch;
  });

  return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Hostel Bookings</h1>
            <p className="text-muted-foreground">
              Manage all hostel bookings from students
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchBookings} variant="outline">
              Refresh
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>All Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex w-full md:max-w-xs">
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-r-none"
                  />
                  <Button variant="default" className="rounded-l-none">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <div>
                  <Select 
                    value={statusFilter} 
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-full md:w-48">
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
              </div>
              
              <TabsContent value={activeTab} className="pt-2">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No bookings found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Hostel</TableHead>
                          <TableHead>Room/Bed</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map((booking) => (
                          <TableRow key={booking._id}>
                            <TableCell className="font-medium">
                              {booking.bookingId || '-'}
                            </TableCell>
                            <TableCell>
                              {booking.userId?.name || '-'}
                              {booking.userId?.email && (
                                <div className="text-xs text-muted-foreground">
                                  {booking.userId.email}
                                  <img src={booking.userId.profilePicture} />
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {booking.hostelId?.name || '-'}
                            </TableCell>
                            <TableCell>
                              Room {booking.bedId?.roomNumber || '-'}, 
                              Bed #{booking.bedId?.number || '-'}
                            </TableCell>
                            <TableCell>
                              {booking.startDate ? format(new Date(booking.startDate), 'dd MMM yyyy') : '-'}
                            </TableCell>
                            <TableCell>
                              {booking.months} month{booking.months !== 1 ? 's' : ''}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(booking.status, booking.paymentStatus)}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={booking.paymentStatus === 'completed' ? 'default' : 'outline'}>
                                {booking.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleViewBooking(booking._id)}
                              >
                                <Eye className="h-4 w-4" />
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
