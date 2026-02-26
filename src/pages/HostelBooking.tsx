
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { razorpayService } from '@/api/razorpayService';
import { useAuth } from '@/hooks/use-auth';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Bed, Building, CreditCard, Calendar, ArrowRight, ChevronLeft } from 'lucide-react';
import { format, addMonths, addWeeks, addDays } from 'date-fns';
import { getImageUrl } from '@/lib/utils';

interface BookingPeriod {
  type: 'daily' | 'weekly' | 'monthly';
  duration: number;
  label: string;
}

const HostelBooking = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, authChecked, isAuthenticated } = useAuth();

  // Get room and sharing option data from location state
  const { room, hostel, sharingOption } = location.state || {};

  const [bookingPeriod, setBookingPeriod] = useState<BookingPeriod>({
    type: 'monthly',
    duration: 1,
    label: '1 Month'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [startDate] = useState<Date>(new Date());
  

   const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
  
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  // Redirect if no room or sharing option
  useEffect(() => {
    if (!room || !sharingOption) {
      toast({
        title: "Missing Information",
        description: "Room or sharing option details are missing",
        variant: "destructive"
      });
      navigate(`/rooms/${roomId}`);
    }
  }, [room, sharingOption, roomId, navigate, toast]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated && authChecked) {
      toast({
        title: "Login Required",
        description: "Please log in to book a room",
        variant: "destructive"
      });
      navigate('/student/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, location.pathname, navigate, toast]);
  
  // Calculate end date based on booking period
  const calculateEndDate = () => {
    if (bookingPeriod.type === 'daily') {
      return addDays(startDate, bookingPeriod.duration);
    } else if (bookingPeriod.type === 'weekly') {
      return addWeeks(startDate, bookingPeriod.duration);
    } else {
      return addMonths(startDate, bookingPeriod.duration);
    }
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    let multiplier = 1;
    if (bookingPeriod.type === 'weekly') {
      multiplier = 7 * bookingPeriod.duration;
    } else if (bookingPeriod.type === 'monthly') {
      multiplier = 30 * bookingPeriod.duration;
    } else {
      multiplier = bookingPeriod.duration;
    }
    
    return sharingOption.price * multiplier;
  };

  const handleBookingPeriodChange = (type: 'daily' | 'weekly' | 'monthly', duration: number) => {
    let label = '';
    
    if (type === 'daily') {
      label = `${duration} ${duration === 1 ? 'Day' : 'Days'}`;
    } else if (type === 'weekly') {
      label = `${duration} ${duration === 1 ? 'Week' : 'Weeks'}`;
    } else {
      label = `${duration} ${duration === 1 ? 'Month' : 'Months'}`;
    }
    
    setBookingPeriod({ type, duration, label });
  };

  const handleProceedToPayment = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "Please log in to complete the booking",
        variant: "destructive"
      });
      return;
    }

    try {

          const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast({
          title: "Payment Failed",
          description: "Unable to load Razorpay SDK. Please try again later.",
          variant: "destructive"
        });
        return;
      }
      setIsProcessing(true);
      
      // Calculate total price and dates
      const totalPrice = calculateTotalPrice();
      const endDate = calculateEndDate();
      
      // Create reservation
      const bookingData = {
        hostelId: hostel._id,
        roomId: room._id,
        sharingType: sharingOption.type,
        sharingOptionId: sharingOption._id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalPrice,
        bookingDuration: bookingPeriod.type,
        durationCount: bookingPeriod.duration
      };
      
      const reserveResponse = await hostelService.bookSharedRoom(bookingData);
      if (reserveResponse.success && reserveResponse.data) {
        setReservationId(reserveResponse.data._id);

        // Create Razorpay order
        const orderData = {
          amount: totalPrice,
          currency: 'INR',
          bookingId: reserveResponse.data._id,
          bookingType: 'hostel' as const,
          bookingDuration: bookingPeriod.type,
          durationCount: bookingPeriod.duration,
          notes: {
            hostelId: hostel._id,
            roomId: room._id,
            sharingType: sharingOption.type,
          }
        };
        
        const orderResponse = await razorpayService.createOrder(orderData);

         if (!orderResponse.success || !orderResponse.data) {
            throw new Error(orderResponse.error?.message || 'Failed to create order');
          }
          
          const order = orderResponse.data;
    
          // Update transaction with Razorpay order ID
        await hostelService.bookSharedRoomUpdateTransactioId(reserveResponse.data._id,{
          razorpay_order_id: order.id
        });
        
        if (orderResponse.success && orderResponse.data.id) {
          // Initialize Razorpay payment
          const razorpayOptions = {
            key: order.KEY_ID,
            amount: totalPrice * 100,
            currency: 'INR',
            name: hostel.name,
            description: `${room.name} - ${sharingOption.type}`,
            order_id: orderResponse.data.id,
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone || '',
            },
            handler: function(response: any) {
              // Verify payment
              handlePaymentSuccess(response);
            },
          };
          
          const rzp = new (window as any).Razorpay(razorpayOptions);
          rzp.open();
        } else {
          throw new Error(orderResponse.error?.message || 'Failed to create payment order');
        }
      } else {
        throw new Error(reserveResponse.message || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Error processing booking:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : 'An error occurred during booking',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      // if (!reservationId) return;
      
      const verifyData = {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
        bookingId: reservationId,
        bookingType: 'hostel',
      };
      
      const verifyResponse = await razorpayService.verifyPayment(verifyData);
      
      if (verifyResponse.success) {
        toast({
          title: "Payment Successful",
          description: "Your booking has been confirmed!",
        });
        
        // Navigate to booking confirmation page
        navigate(`/booking-confirmation/${verifyResponse.data?.bookingId}`, { 
          state: { 
            bookingId: verifyResponse.data?.bookingId || reservationId
          } 
        });
      } else {
        throw new Error(verifyResponse.error?.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast({
        title: "Payment Verification Failed",
        description: error instanceof Error ? error.message : 'Failed to verify payment',
        variant: "destructive"
      });
    }
  };

  if (!room || !hostel || !sharingOption) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Missing Information</CardTitle>
            <CardDescription>Room or sharing option details are missing</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/hostels')}>Browse Hostels</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Room Details
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Room Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded overflow-hidden bg-muted flex-shrink-0">
                      {room.imageSrc ? (
                        <img src={getImageUrl(room.imageSrc)} alt={room.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Bed className="h-10 w-10 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{room.name}</h3>
                      <p className="text-muted-foreground text-sm">Room #{room.roomNumber}, {room.floor} Floor</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{hostel.name}, {hostel.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Sharing Type</Label>
                      <div className="mt-1 font-medium">{sharingOption.type}</div>
                      <div className="text-sm text-muted-foreground mt-1">{sharingOption.capacity} persons per unit</div>
                    </div>
                    <div>
                      <Label>Price</Label>
                      <div className="mt-1 font-medium">₹{sharingOption.price} per day</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Booking Duration</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm">Daily</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {[1, 3, 5, 7, 10, 15].map(days => (
                            <Button
                              key={`daily-${days}`}
                              type="button"
                              variant={bookingPeriod.type === 'daily' && bookingPeriod.duration === days ? 'default' : 'outline'}
                              size="sm"
                              className="w-full"
                              onClick={() => handleBookingPeriodChange('daily', days)}
                            >
                              {days} {days === 1 ? 'day' : 'days'}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Weekly</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {[1, 2, 3, 4].map(weeks => (
                            <Button
                              key={`weekly-${weeks}`}
                              type="button"
                              variant={bookingPeriod.type === 'weekly' && bookingPeriod.duration === weeks ? 'default' : 'outline'}
                              size="sm"
                              className="w-full"
                              onClick={() => handleBookingPeriodChange('weekly', weeks)}
                            >
                              {weeks} {weeks === 1 ? 'week' : 'weeks'}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Monthly</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          {[1, 3, 6, 12].map(months => (
                            <Button
                              key={`monthly-${months}`}
                              type="button"
                              variant={bookingPeriod.type === 'monthly' && bookingPeriod.duration === months ? 'default' : 'outline'}
                              size="sm"
                              className="w-full"
                              onClick={() => handleBookingPeriodChange('monthly', months)}
                            >
                              {months} {months === 1 ? 'month' : 'months'}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Check-in Date</Label>
                      <div className="mt-1 font-medium">{format(startDate, 'PPP')}</div>
                    </div>
                    <div>
                      <Label>Check-out Date</Label>
                      <div className="mt-1 font-medium">{format(calculateEndDate(), 'PPP')}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium">Total Amount</div>
                    <div className="text-2xl font-bold text-primary">₹{calculateTotalPrice()}</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Booking Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={user.name} disabled className="mt-1" />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user.email} disabled className="mt-1" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input id="phone" value={user.phone || ''} disabled className="mt-1" />
                        </div>
                      </>
                    )}
                    <div>
                      <Label htmlFor="notes">Special Requests (Optional)</Label>
                      <textarea
                        id="notes"
                        className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[80px]"
                        placeholder="Any special requirements or requests..."
                      ></textarea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right column - Payment Summary */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-xl">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room Charges</span>
                      <span>
                        ₹{sharingOption.price} ×{" "}
                        {bookingPeriod.type === "daily" && `${bookingPeriod.duration} days`}
                        {bookingPeriod.type === "weekly" &&
                          `${bookingPeriod.duration} weeks (${bookingPeriod.duration * 7} days)`}
                        {bookingPeriod.type === "monthly" &&
                          `${bookingPeriod.duration} months (${bookingPeriod.duration * 30} days)`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax & Service Fee</span>
                      <span>Included</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Amount</span>
                    <span className="text-xl font-bold">₹{calculateTotalPrice()}</span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={isProcessing}
                    onClick={handleProceedToPayment}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                  
                  <div className="text-xs text-center text-muted-foreground">
                    By proceeding, you agree to our terms and conditions.
                    <br />Your card will be charged only after confirmation.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
      </div>
    </ErrorBoundary>
  );
};

export default HostelBooking;