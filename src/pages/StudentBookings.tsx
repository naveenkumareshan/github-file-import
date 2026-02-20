import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingsList } from '@/components/booking/BookingsList';
import { useToast } from '@/hooks/use-toast';
import { bookingManagementService } from '@/api/bookingManagementService';
import { format } from 'date-fns';
import { Calendar, Building } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// import { FirebaseNotificationSetup } from '@/components/notifications/FirebaseNotificationSetup';

interface Booking {
  id: string;
  cabinId: string;
  cabinCode: string;
  startDate: string;
  createdAt: string;
  endDate: string;
  originalPrice?: number;
  totalPrice: number;
  appliedCoupon?: {
    couponCode: string;
    discountAmount: number;
    couponType: string;
    couponValue: number;
  };
  seatPrice:number;
  status: 'pending' | 'completed' | 'failed';
  paymentStatus: 'pending' | 'completed' | 'failed';
  bookingType: 'cabin' | 'hostel' | 'laundry';
  itemName: string;
  itemNumber: number;
  itemImage?: string;
  transferredHistory:any;
  keyDeposit?: number;
  bookingStatus:string;
}

const StudentBookings = () => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchBookings();
  }, [isAuthenticated]);
  
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      
      // Get current bookings
      const currentResponse = await bookingManagementService.getCurrentBookings();
      
      if (currentResponse.success) {
        // Transform data to match our UI component
        const transformedCurrentBookings = currentResponse.data
        // .filter((booking: any) => booking.status === "completed")
        .map((booking: any) => ({
          id: booking._id || booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status,
          createdAt: booking.createdAt,
          totalPrice: booking.totalPrice,
          originalPrice: booking.originalPrice,
          appliedCoupon: booking.appliedCoupon,
          seatPrice: booking.seatPrice,
          cabinId: booking.cabinId,
          seatId: booking.seatId,
          paymentStatus: booking.paymentStatus,
          bookingType: booking.cabinId ? 'cabin' : booking.hostelId ? 'hostel' : 'laundry',
          itemName: booking.cabinId?.name || booking.hostelId?.name || 'Laundry Service',
          itemNumber: booking.seatId?.number || booking.bedId?.number || 0,
          itemImage: booking.cabinId?.imageUrl || booking.hostelId?.logoImage,
          bookingStatus: booking.bookingStatus,
          location : booking.location,
          keyDeposit : booking.keyDeposit
        }));
        
        setCurrentBookings(transformedCurrentBookings);
      } else {
        setCurrentBookings([]);
      }
      
      // Get booking history
      const historyResponse = await bookingManagementService.getBookingHistory();
      
      if (historyResponse.success) {
        // Transform data to match our UI component
        const transformedHistoryBookings = historyResponse.data.map((booking: any) => ({
          id: booking._id || booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          createdAt: booking.createdAt,
          totalPrice: booking.totalPrice,
          originalPrice: booking.originalPrice,
          appliedCoupon: booking.appliedCoupon,
          cabinId: booking.cabinId,
          seatId: booking.seatId,
          paymentStatus: booking.paymentStatus,
          bookingType: booking.cabinId ? 'cabin' : booking.hostelId ? 'hostel' : 'laundry',
          itemName: booking.cabinId?.name || booking.hostelId?.name || 'Laundry Service',
          itemNumber: booking.seatId?.number || booking.bedId?.number || 0,
          itemImage: booking.cabinId?.imageUrl || booking.hostelId?.logoImage,
          location : booking.location
        }));
        
        setPastBookings(transformedHistoryBookings);
      } else {
        setPastBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your bookings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
    const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PP');
  };
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-screen-xl">
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
              {/* <FirebaseNotificationSetup></FirebaseNotificationSetup> */}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className='p-2 mt-6'>
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-muted-foreground">Manage your current and past bookings</p>
        </div>
      </div>
      
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="w-full sm:w-auto mb-6">
          <TabsTrigger value="current" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Active Bookings
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            Expired Bookings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="mt-0">
          <BookingsList 
            bookings={currentBookings} 
            isLoading={isLoading}
            onBookingCancelled={fetchBookings}
          />
        </TabsContent>
        
        <TabsContent value="past" className="mt-0">
          <BookingsList 
            bookings={pastBookings} 
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentBookings;
