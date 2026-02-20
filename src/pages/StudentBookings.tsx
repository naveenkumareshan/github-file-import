import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { BookingsList } from '@/components/booking/BookingsList';
import { useToast } from '@/hooks/use-toast';
import { bookingManagementService } from '@/api/bookingManagementService';
import { format } from 'date-fns';
import { Calendar, Building, BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Booking {
  id: string;
  cabinId: string;
  cabinCode: string;
  startDate: string;
  createdAt: string;
  endDate: string;
  originalPrice?: number;
  totalPrice: number;
  appliedCoupon?: { couponCode: string; discountAmount: number; couponType: string; couponValue: number };
  seatPrice: number;
  status: 'pending' | 'completed' | 'failed';
  paymentStatus: 'pending' | 'completed' | 'failed';
  bookingType: 'cabin' | 'hostel' | 'laundry';
  itemName: string;
  itemNumber: number;
  itemImage?: string;
  transferredHistory: any;
  keyDeposit?: number;
  bookingStatus: string;
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
      const mapBooking = (booking: any) => ({
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
        location: booking.location,
        keyDeposit: booking.keyDeposit,
      });

      const [currentRes, historyRes] = await Promise.all([
        bookingManagementService.getCurrentBookings(),
        bookingManagementService.getBookingHistory(),
      ]);

      setCurrentBookings(currentRes.success ? currentRes.data.map(mapBooking) : []);
      setPastBookings(historyRes.success ? historyRes.data.map(mapBooking) : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({ title: 'Error', description: 'Failed to fetch your bookings', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const activeCount = Array.isArray(currentBookings)
    ? currentBookings.filter(b => b.paymentStatus === 'completed').length
    : 0;

  const nextPayment = currentBookings.length > 0
    ? format(new Date(currentBookings[0].endDate), 'PP')
    : 'N/A';

  return (
    <div className="min-h-screen bg-background">
      {/* App-style header section */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 pt-5 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-white/70 text-sm mb-1">Welcome back</p>
          <h1 className="text-2xl font-bold mb-5">{user?.name || 'Student'}</h1>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white/10 border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">Active Bookings</p>
                    <p className="text-white font-bold text-xl">{activeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-0 shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs">Next Payment</p>
                    <p className="text-white font-bold text-sm">{nextPayment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        {/* Book new button */}
        <Button
          onClick={() => navigate('/cabins')}
          className="w-full mb-5 rounded-2xl py-5 shadow-md bg-card text-primary border border-primary/20 hover:bg-primary/5 flex items-center gap-2"
          variant="outline"
        >
          <Plus className="w-5 h-5" />
          Book a New Reading Room
        </Button>

        <h2 className="text-lg font-bold text-foreground mb-4">My Bookings</h2>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="w-full mb-4 rounded-xl">
            <TabsTrigger value="current" className="flex-1 rounded-xl">
              <BookOpen className="h-4 w-4 mr-1.5" />
              Active
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 rounded-xl">
              <Calendar className="h-4 w-4 mr-1.5" />
              Expired
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-0">
            <BookingsList bookings={currentBookings} isLoading={isLoading} onBookingCancelled={fetchBookings} />
          </TabsContent>
          <TabsContent value="past" className="mt-0">
            <BookingsList bookings={pastBookings} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentBookings;
