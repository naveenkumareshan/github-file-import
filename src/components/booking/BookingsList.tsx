
import React, { lazy, Suspense} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { bookingsService } from '@/api/bookingsService';
import { format } from 'date-fns';
import { Calendar, X, Eye, Receipt, TicketPercent } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BookingRenewal } from './BookingRenewal';
import { BookingExpiryDetails } from '@/pages/students/BookingExpiryDetails';
const PaymentTimer = lazy(() =>
  import("@/components/booking/PaymentTimer").then((m) => ({
    default: m.PaymentTimer,
  }))
);
import { RazorpayCheckout } from '@/components/payment/RazorpayCheckout';
import { formatBookingPeriod } from '@/utils/currency';

interface BookingDisplay {
  id: string;
  cabinId:any;
  cabinCode:string;
  startDate: string;
  createdAt:string;
  endDate: string;
  originalPrice?: number;
  totalPrice: number;
  appliedCoupon?: {
    couponCode: string;
    discountAmount: number;
    couponType: string;
    couponValue: number;
  };
  paymentStatus: 'pending' | 'completed' | 'failed';
  bookingType: 'cabin' | 'hostel' | 'laundry';
  itemName: string;
  itemNumber: number;
  itemImage?: string;
  durationCount?: number;
  bookingId?: string;
  status?: string;
  transferredHistory?: any;
  bookingStatus?: string;
  keyDeposit?: number;
  seatPrice?: number;
  bookingDuration?: 'daily' | 'monthly' | 'weekly';
  userId?: string | { name: string; email: string };
  seatId?: string | { _id: string; number: number, price:number };
}

interface BookingsListProps {
  bookings: BookingDisplay[];
  isLoading?: boolean;
  showRenewalOption?: boolean;
  onBookingCancelled?: () => void;
  onBookingRenewed?: () => void;
}

export const BookingsList = ({ 
  bookings, 
  isLoading = false,
  showRenewalOption = true,
  onBookingCancelled,
  onBookingRenewed
}: BookingsListProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await bookingsService.cancelBooking(bookingId);
      
      if (response.success) {
        toast({
          title: "Booking cancelled",
          description: "Your booking has been cancelled successfully",
          variant: "default"
        });
        
        if (onBookingCancelled) {
          onBookingCancelled();
        }
      } else {
        throw new Error(response.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Cancel booking error:", error);
      toast({
        title: "Cancel failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Check if a booking can be renewed (not expired and cabin type)
  const canRenew = (booking: BookingDisplay) => {
    const isNotExpired = new Date(booking.endDate) > new Date();
    return isNotExpired && booking.bookingType === 'cabin' && booking.status !== 'cancelled';
  };

  const handlePaymentExpiry = (bookingId: string) => {
    toast({
      title: "ID : "+bookingId+" Payment Expired",
      description: "The payment window has expired. Please create a new booking.",
      variant: "destructive"
    });
    if (onBookingCancelled) {
      onBookingCancelled();
    }
  };

  const handleRetryPayment = (booking: BookingDisplay) => {
    toast({
      title: "ID : "+booking.bookingId+" Retrying Payment",
      description: "Please complete your payment below.",
    });
    // The payment will be handled by the RazorpayCheckout component below
  };

  const handlePaymentSuccess = (bookingId: string) => {
    toast({
      title: "ID : "+bookingId+"Payment Successful",
      description: "Your booking has been confirmed!",
    });
    // Refresh the bookings list
    if (onBookingCancelled) {
      onBookingCancelled();
    }
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    toast({
      title: "Payment Failed",
      description: "There was an issue with your payment. Please try again.",
      variant: "destructive"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Payment Success</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-red-500 text-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No bookings found</h3>
          <p className="text-muted-foreground">
            When you make a booking, it will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="grid gap-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/6">
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {booking.itemImage ? (
                    <img 
                      src={booking.itemImage} 
                      alt={booking.itemName} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-secondary/20">
                      <Calendar className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{booking.cabinId?.cabinCode || booking.cabinCode}</h3>
                    <h3 className="text-lg font-medium">{booking.itemName}</h3>
                    {booking.bookingType === 'cabin' && (
                      <p className="text-muted-foreground">Seat #{booking.itemNumber}  Address : {booking.cabinId?.location?.fullAddress}</p>
                    )}
                    {booking.bookingType === 'hostel' && (
                      <p className="text-muted-foreground">Bed #{booking.itemNumber}</p>
                    )}
                    {booking.bookingId && (
                      <p className="text-xs text-muted-foreground mt-1">Booking ID: {booking.bookingId}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 mt-2 md:mt-0">
                    {booking.paymentStatus && getStatusBadge(booking.paymentStatus)}
                    {booking.paymentStatus === 'pending' && booking.createdAt && (
                      <PaymentTimer 
                        createdAt={booking.createdAt}
                        onExpiry={() => handlePaymentExpiry(booking.id)}
                        onRetryPayment={() => handleRetryPayment(booking)}
                        variant="compact"
                        showRetryButton={false}
                      />
                    )}
                    {(booking.bookingStatus === 'transferred') && (
                      <Badge variant="outline" className="border-amber-500 text-amber-500">Transferred</Badge>
                    )}
                  </div>
                </div>

                {/* Payment Timer - Full display for pending payments */}
                {booking.paymentStatus === 'pending' && booking.createdAt && (
                  <div className="mb-4">
                    <Suspense fallback={<div className="p-3 text-sm text-muted-foreground">Loading payment timer...</div>}>
                      <PaymentTimer 
                        createdAt={booking.createdAt}
                        onExpiry={() => handlePaymentExpiry(booking.id)}
                        onRetryPayment={() => handleRetryPayment(booking)}
                        variant="full"
                        showRetryButton={false} 
                      />
                    </Suspense>
                  </div>
                )}

                {/* Coupon Information */}
                {booking.appliedCoupon && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TicketPercent className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Coupon Applied</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Code: </span>
                        <span className="font-medium text-green-600">{booking.appliedCoupon.couponCode}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Discount: </span>
                        <span className="font-medium text-green-600">₹{booking.appliedCoupon.discountAmount}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Booked On</p>
                    <p>{format(new Date(booking.createdAt), 'dd MMM yyyy h:mm:ss a')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Check-in Date</p>
                    <p>{formatBookingPeriod(booking.startDate, null)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Check-out Date</p>
                    <p>{formatBookingPeriod(null, booking?.endDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Seat Price</h3>
                    <p className="font-medium text-green-600">₹{booking.seatPrice ? booking.seatPrice.toLocaleString() : booking.totalPrice.toLocaleString() }</p>
                  </div>
                  { booking.keyDeposit > 0 && 
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Key Deposit</h3>
                      <p className="font-medium text-green-600">₹{booking.keyDeposit ? booking.keyDeposit.toLocaleString() : booking.keyDeposit.toLocaleString() }</p>
                    </div>
                  }
                  <div>
                    <p className="text-sm font-medium">Amount</p>
                    {booking.originalPrice && booking.appliedCoupon ? (
                      <div>
                        <p className="text-sm text-muted-foreground line-through">₹{booking.originalPrice.toLocaleString()}</p>
                        <p className="font-medium text-green-600">₹{booking.totalPrice.toLocaleString()}</p>
                        <p className="text-xs text-green-600">You saved ₹{booking.appliedCoupon.discountAmount}</p>
                      </div>
                    ) : (
                      <p className="font-medium">₹{booking.totalPrice.toLocaleString()}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {/* Payment section for pending bookings */}
                  {booking.paymentStatus === 'pending' && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-700 mb-3">
                        Complete your payment to confirm this booking
                      </p>
                      <RazorpayCheckout
                        amount={booking.totalPrice}
                        bookingId={booking.id}
                        bookingType={booking.bookingType}
                        endDate={new Date(booking.endDate)}
                        bookingDuration={booking.bookingDuration || 'monthly'}
                        durationCount={booking.durationCount || 1}
                        onSuccess={() => handlePaymentSuccess(booking.id)}
                        onError={handlePaymentError}
                        buttonText="Complete Payment"
                        buttonVariant="default"
                        className="w-full"
                      />
                    </div>
                  )}

                  { booking.paymentStatus =='completed' && canRenew(booking) && (
                    <Link to={`/student/bookings/${booking.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  )}
                  
                  {booking.paymentStatus === 'pending'  && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 border-red-200 hover:bg-red-50"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                  
                  { booking.paymentStatus =='completed' && showRenewalOption  && (
                    <BookingRenewal
                      booking={booking}
                      onRenewalComplete={onBookingRenewed || (() => {})}
                    />
                  )}
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
