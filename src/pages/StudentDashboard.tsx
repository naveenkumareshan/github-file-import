
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { bookingsService } from '@/api/bookingsService';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Building, Calendar, Check, ArrowUp, ArrowDown } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { BookingExpiryDetails } from '@/pages/students/BookingExpiryDetails';
import { formatBookingPeriod } from '@/utils/currency';

interface BookingData {
  durationCount: string;
  bookingDuration: string;
  _id: string;
  cabinId: {
    name: string;
    category: string;
    _id: string;
  };
  seatId: {
    number: number;
    _id: string;
  };
  startDate: string;
  endDate: string;
  months: number;
  totalPrice: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
}

interface LaundryOrder {
  _id: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: string;
}

const StudentDashboard: React.FC = () => {
  const [currentBookings, setCurrentBookings] = useState<BookingData[]>([]);
  const [bookingHistory, setBookingHistory] = useState<BookingData[]>([]);
  const [laundryOrders, setLaundryOrders] = useState<LaundryOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingLaundry, setLoadingLaundry] = useState<boolean>(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookingData();
    fetchLaundryOrders();
  }, []);

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      
      const currentResponse = await bookingsService.getCurrentBookings();
      if (currentResponse.success && currentResponse.data) {
        if(currentResponse.data.data.length > 0){
          setCurrentBookings(currentResponse.data.data);
        }
      }
      
      const historyResponse = await bookingsService.getBookingHistory();
      if (historyResponse.success && historyResponse.data) {
        if(historyResponse.data.data.length > 0){
          setBookingHistory(historyResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching booking data:', error);
      toast({
        title: "Error",
        description: "Failed to load booking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLaundryOrders = async () => {
    try {
      setLoadingLaundry(true);
      
      // Using mock data since we don't have this endpoint yet
      // In a real app, this would be laundryService.getUserOrders()
      const mockLaundryOrders: LaundryOrder[] = [
        {
          _id: '1',
          items: [
            { name: 'T-Shirts', quantity: 3, price: 45 },
            { name: 'Pants', quantity: 2, price: 60 }
          ],
          status: 'completed',
          totalAmount: 255,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        },
        {
          _id: '2',
          items: [
            { name: 'Bed Sheets', quantity: 1, price: 90 },
            { name: 'Towels', quantity: 2, price: 40 }
          ],
          status: 'processing',
          totalAmount: 170,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
        }
      ];
      
      setLaundryOrders(mockLaundryOrders);
    } catch (error) {
      console.error('Error fetching laundry orders:', error);
    } finally {
      setLoadingLaundry(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-500">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PP');
  };

  let totalSpent = 0;

  if (Array.isArray(currentBookings) && Array.isArray(bookingHistory)) {
    totalSpent = [...currentBookings, ...bookingHistory]
      .filter(booking => booking.paymentStatus === 'completed')
      .reduce((sum, booking) => sum + booking.totalPrice, 0);
  }
  // Calculate total spent on laundry
  const totalLaundrySpent = laundryOrders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <div className="container mx-auto px-4 py-6 flex-grow">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <CardTitle className="text-3xl font-bold">Student Dashboard</CardTitle>
                    <CardDescription>Welcome back, {user?.name}</CardDescription>
                  </div>
                  <Button onClick={() => navigate('/cabins')}>Book New Cabin</Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Bookings</p>
                         <h3 className="text-2xl font-bold mt-1">
                            {Array.isArray(currentBookings)
                              ? currentBookings.filter(b => b.paymentStatus === 'completed').length
                              : 0}
                          </h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Building className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Spent</p>
                          <h3 className="text-2xl font-bold mt-1">₹{totalSpent}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <ArrowDown className="h-6 w-6 text-green-600 dark:text-green-300" />
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Bookings: ₹{totalSpent} | Laundry: ₹{totalLaundrySpent}
                      </div>
                    </CardContent>
                  </Card> */}
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Next Payment</p>
                          <h3 className="text-2xl font-bold mt-1">
                            {currentBookings.length > 0 ? (
                              formatDate(currentBookings[0].endDate)
                            ) : (
                              'N/A'
                            )}
                          </h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-300" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Tabs defaultValue="bookings" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
                  <TabsTrigger value="bookings">Current Bookings</TabsTrigger>
                  <TabsTrigger value="history">Booking History</TabsTrigger>
                  {/* <TabsTrigger value="laundry">Laundry Orders</TabsTrigger> */}
                </TabsList>
                  
                  <TabsContent value="bookings" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Bookings</CardTitle>
                        <CardDescription>Your active and upcoming bookings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
                          </div>
                        ) : currentBookings.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">You don't have any current bookings.</p>
                            <Button onClick={() => navigate('/cabins')} className="mt-4">
                              Browse Cabins
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {currentBookings.map((booking) => (
                              <div key={booking._id} onClick={() => navigate(`/student/bookings/${booking._id}`)} className="cursor-pointer hover:bg-gray-300 transition rounded-lg border p-4 border rounded-2xl p-5 shadow-md bg-white space-y-4">
                              {/* Top: Title & Status */}
                              <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{booking.cabinId.name}</h3>
                                  <p className="text-sm text-gray-500">
                                    Seat #{booking.seatId.number} • {booking.cabinId.category}
                                  </p>
                                </div>
                                <div className="mt-2 md:mt-0">
                                  {getStatusBadge(booking.paymentStatus)}
                                </div>
                              </div>

                              {/* Grid Info */}
                              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Period</p>
                              <p>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</p>
                            </div>
                          
                            <div className="flex justify-between items-center sm:block sm:space-y-1 text-sm text-gray-700">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                              <p>{booking.durationCount}</p>
                            </div>
                            <div className="flex justify-between items-center sm:block sm:space-y-1 text-sm text-gray-700">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                              <p>{booking.bookingDuration}</p>
                            </div>

                            <div className="flex justify-between items-center sm:block sm:space-y-1 text-sm text-gray-700">
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Price</p>
                              <p className="font-medium text-green-700">₹{booking.totalPrice}</p>
                            </div>
                            
                          </div>
                            {booking.paymentStatus =='completed' &&
                              <BookingExpiryDetails
                                startDate={booking.startDate}
                                endDate={booking.endDate}
                                status={booking.paymentStatus}
                                paymentStatus={booking.paymentStatus}
                              />
                             }
                            </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Booking History</CardTitle>
                        <CardDescription>Your past bookings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
                          </div>
                        ) : bookingHistory.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">You don't have any past bookings.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {bookingHistory.map((booking) => (
                              <div key={booking._id} className="border rounded-lg p-4">
                                <div className="flex flex-col md:flex-row justify-between">
                                  <div>
                                    <h3 className="font-medium">{booking.cabinId.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Seat #{booking.seatId.number} • {booking.cabinId.category}
                                    </p>
                                  </div>
                                  <div className="mt-2 md:mt-0">
                                    {getStatusBadge(booking.paymentStatus)}
                                  </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Period</p>
                                    <p className="text-sm">{formatBookingPeriod(booking?.startDate, booking?.endDate)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="text-sm">{booking.months} months</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Price</p>
                                    <p className="text-sm">₹{booking.totalPrice}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
{/*                   
                  <TabsContent value="laundry" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Laundry Orders</CardTitle>
                        <CardDescription>Your laundry service orders</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {loadingLaundry ? (
                          <div className="flex justify-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
                          </div>
                        ) : laundryOrders.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">You don't have any laundry orders.</p>
                            <Button onClick={() => navigate('/laundry')} className="mt-4">
                              Order Laundry Service
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {laundryOrders.map((order) => (
                              <div key={order._id} className="border rounded-lg p-4">
                                <div className="flex flex-col md:flex-row justify-between">
                                  <div>
                                    <h3 className="font-medium">Order #{order._id}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(order.createdAt)}
                                    </p>
                                  </div>
                                  <div className="mt-2 md:mt-0">
                                    {getStatusBadge(order.status)}
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <p className="text-xs text-muted-foreground mb-2">Items</p>
                                  <div className="space-y-1">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.name} x {item.quantity}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                      </div>
                                    ))}
                                    <div className="border-t pt-1 mt-2 flex justify-between font-medium">
                                      <span>Total</span>
                                      <span>₹{order.totalAmount}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                  <Button variant="outline" size="sm">
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent> */}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default StudentDashboard;
