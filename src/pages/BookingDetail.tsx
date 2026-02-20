import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, IndianRupee, Bed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bookingsService } from '@/api/bookingsService';
import { RazorpayCheckout } from '@/components/payment/RazorpayCheckout';
import { PaymentTimer } from '@/components/booking/PaymentTimer';

const BookingDetail = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);
  
  const fetchBookingDetails = async () => {
    if (!bookingId) return;
    
    try {
      setLoading(true);
      const response = await bookingsService.getBookingById(bookingId);
      
      if (response.success && response.data) {
        console.log("Booking details:", response.data);
        setBooking(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Your booking has been confirmed",
    });
    fetchBookingDetails(); // Refresh booking details after payment
  };

   const handlePaymentExpiry = () => {
    toast({
      title: "Payment Time Expired",
      description: "Your booking has expired. Please create a new booking.",
      variant: "destructive"
    });
    navigate('/cabins');
  };

  const handleRetryPayment = () => {
    console.log('Retrying Payment')
    toast({
      title: "Retrying Payment",
      description: "Please complete your payment below.",
    });
    // The RazorpayCheckout component will handle the retry
  };
  
  const formatDuration = (booking: any) => {
    if (!booking || !booking.bookingDuration) return "N/A";
    
    if (booking.bookingDuration === 'daily') {
      return `${booking.durationCount || 1} day(s)`;
    } else if (booking.bookingDuration === 'weekly') {
      return `${booking.durationCount || 1} week(s)`;
    } else {
      return `${booking.durationCount || 1} month(s)`;
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-medium text-center">Booking not found</h3>
              <Button className="mt-4" onClick={handleGoBack}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  const cabinInfo = booking.cabinId || {};
  const seatInfo = booking.seatId || {};
  const userInfo = booking.userId || {};
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Badge variant={
            booking.paymentStatus === 'completed' ? 'default' :
            booking.paymentStatus === 'pending' ? 'outline' : 'destructive'
          } className="text-sm">
            {booking.paymentStatus.toUpperCase()}
          </Badge>
        </div>
        {/* Payment Timer for pending bookings */}
        {booking.paymentStatus === 'pending' && booking.createdAt && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <PaymentTimer 
                createdAt={booking.createdAt}
                onExpiry={handlePaymentExpiry}
                onRetryPayment={handleRetryPayment}
                variant="full"
                showRetryButton={true}
              />
              <p className="text-sm text-amber-700 mt-2">
                Complete your payment before the timer expires or your booking will be cancelled.
              </p>
            </CardContent>
          </Card>
        )}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">
              Booking Details
              {booking.bookingId && (
                <span className="text-sm text-muted-foreground ml-2">#{booking.bookingId}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Booking Period</h3>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {format(new Date(booking.startDate), 'dd MMM yyyy')} - {format(new Date(booking.endDate), 'dd MMM yyyy')}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Duration: {formatDuration(booking)}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Payment Details</h3>
                <div className="flex items-center">
                  <IndianRupee className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="font-medium">₹{booking.totalPrice.toFixed(2)}</span>
                </div>
                {booking.paymentMethod && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    Method: {booking.paymentMethod}
                  </div>
                )}
                {booking.paymentDate && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    Paid on: {format(new Date(booking.paymentDate), 'dd MMM yyyy')}
                  </div>
                )}
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Room & Seat Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 bg-muted/50 rounded-md">
                  <h4 className="font-medium">Room</h4>
                  <p className="text-sm mt-1">{cabinInfo.name || 'N/A'}</p>
                  {cabinInfo.category && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      {cabinInfo.category}
                    </Badge>
                  )}
                </div>
                <div className="p-3 bg-muted/50 rounded-md">
                  <h4 className="font-medium">Seat</h4>
                  <div className="flex items-center mt-1">
                    <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-sm">#{seatInfo.number || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {booking.paymentStatus === 'pending' && (
              <div className="mt-6 flex justify-center">
                <RazorpayCheckout
                  amount={booking.totalPrice}
                  bookingId={booking._id}
                  bookingType="cabin"
                  endDate={booking.endDate}
                  bookingDuration={booking.bookingDuration || 'monthly'}
                  durationCount={booking.durationCount || 1}
                  onSuccess={handlePaymentSuccess}
                  onError={(error: any) => {
                    console.error("Payment error:", error);
                    toast({
                      title: "Payment Failed",
                      description: "There was an issue with your payment. Please try again.",
                      variant: "destructive"
                    });
                  }}
                  buttonText="Complete Payment"
                  buttonVariant="default"
                  className="px-8"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default BookingDetail;
