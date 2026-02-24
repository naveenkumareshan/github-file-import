import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { BookingsList } from '@/components/booking/BookingsList';
import { useToast } from '@/hooks/use-toast';
import { bookingsService } from '@/api/bookingsService';
import { format } from 'date-fns';
import { Calendar, Building, BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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

      const [currentRes, historyRes] = await Promise.all([
        bookingsService.getCurrentBookings(),
        bookingsService.getBookingHistory(),
      ]);

      const allCurrentRaw = currentRes.success ? currentRes.data : [];
      const allHistoryRaw = historyRes.success ? historyRes.data : [];

      // Collect all unique cabin_id + seat_number pairs to look up seat UUIDs & prices
      const seatLookupKeys = new Set<string>();
      [...allCurrentRaw, ...allHistoryRaw].forEach((b: any) => {
        if (b.cabin_id && b.seat_number) {
          seatLookupKeys.add(`${b.cabin_id}|${b.seat_number}`);
        }
      });

      // Fetch seat info for all relevant cabin+seat_number combos
      const seatMap = new Map<string, { id: string; price: number; number: number }>();
      if (seatLookupKeys.size > 0) {
        const cabinIds = [...new Set([...seatLookupKeys].map(k => k.split('|')[0]))];
        const { data: seatsData } = await supabase
          .from('seats')
          .select('id, cabin_id, number, price')
          .in('cabin_id', cabinIds);
        (seatsData || []).forEach((s: any) => {
          seatMap.set(`${s.cabin_id}|${s.number}`, { id: s.id, price: s.price, number: s.number });
        });
      }

      const mapBooking = (booking: any) => {
        const seatInfo = seatMap.get(`${booking.cabin_id}|${booking.seat_number}`);
        return {
          id: booking.id,
          startDate: booking.start_date,
          endDate: booking.end_date,
          status: booking.payment_status,
          createdAt: booking.created_at,
          totalPrice: booking.total_price,
          originalPrice: booking.total_price,
          appliedCoupon: undefined,
          seatPrice: seatInfo?.price || booking.total_price,
          cabinId: booking.cabin_id,
          seatId: seatInfo ? { _id: seatInfo.id, number: seatInfo.number, price: seatInfo.price } : null,
          paymentStatus: booking.payment_status,
          bookingType: 'cabin' as const,
          itemName: booking.cabins?.name || 'Reading Room',
          itemNumber: booking.seat_number || 0,
          itemImage: booking.cabins?.image_url,
          bookingStatus: booking.payment_status,
          location: booking.cabins?.city,
          keyDeposit: undefined,
          cabinCode: booking.cabin_id || '',
          transferredHistory: null,
        };
      };

      setCurrentBookings(allCurrentRaw.map(mapBooking));
      const today = new Date().toISOString().split('T')[0];
      const allHistory = allHistoryRaw.map(mapBooking);
      setPastBookings(allHistory.filter((b: Booking) => b.endDate < today || b.paymentStatus !== 'completed'));
    } catch (error) {
      console.error('Error fetching bookings:', error);
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
      {/* Compact gradient header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-3 pt-4 pb-7">
        <div className="max-w-lg mx-auto">
          <p className="text-white/70 text-[11px] mb-0.5">Welcome back</p>
          <h1 className="text-[17px] font-bold mb-4">{user?.name || 'Student'}</h1>

          <div className="grid grid-cols-2 gap-2.5">
            <Card className="bg-white/10 border-0 shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[10px]">Active Bookings</p>
                    <p className="text-white font-bold text-[15px]">{activeCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-0 shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white/70 text-[10px]">Next Payment</p>
                    <p className="text-white font-bold text-[12px]">{nextPayment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-3 -mt-3">
        <Button
          onClick={() => navigate('/cabins')}
          className="w-full mb-4 rounded-2xl py-3 shadow-sm bg-card text-primary border border-primary/20 hover:bg-primary/5 flex items-center gap-2 text-[13px]"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Book a New Reading Room
        </Button>

        <h2 className="text-[15px] font-semibold text-foreground mb-3">My Bookings</h2>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="w-full mb-3 rounded-xl">
            <TabsTrigger value="current" className="flex-1 rounded-xl text-[12px]">
              <BookOpen className="h-3.5 w-3.5 mr-1" />
              Active
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 rounded-xl text-[12px]">
              <Calendar className="h-3.5 w-3.5 mr-1" />
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
