
import React, { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { bookingsService } from '@/api/bookingsService';
import { format } from 'date-fns';
import { Calendar, X, Eye, TicketPercent } from 'lucide-react';
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
  cabinId: any;
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
  seatId?: string | { _id: string; number: number; price: number };
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
  onBookingRenewed,
}: BookingsListProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const response = await bookingsService.cancelBooking(bookingId);
      if (response.success) {
        toast({ title: "Booking cancelled", description: "Your booking has been cancelled successfully" });
        if (onBookingCancelled) onBookingCancelled();
      } else {
        throw new Error(response.error || "Failed to cancel booking");
      }
    } catch (error) {
      toast({ title: "Cancel failed", description: error.message || "Something went wrong.", variant: "destructive" });
    }
  };

  const canRenew = (booking: BookingDisplay) => {
    const isNotExpired = new Date(booking.endDate) > new Date();
    return isNotExpired && booking.bookingType === 'cabin' && booking.status !== 'cancelled';
  };

  const handlePaymentExpiry = (bookingId: string) => {
    toast({ title: "Payment Expired", description: "The payment window has expired. Please create a new booking.", variant: "destructive" });
    if (onBookingCancelled) onBookingCancelled();
  };

  const handleRetryPayment = (booking: BookingDisplay) => {
    toast({ title: "Retrying Payment", description: "Please complete your payment below." });
  };

  const handlePaymentSuccess = (bookingId: string) => {
    toast({ title: "Payment Successful", description: "Your booking has been confirmed!" });
    if (onBookingCancelled) onBookingCancelled();
  };

  const handlePaymentError = (error: any) => {
    toast({ title: "Payment Failed", description: "There was an issue with your payment.", variant: "destructive" });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500 text-[10px] px-1.5 py-0.5">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px] px-1.5 py-0.5">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="border-destructive text-destructive text-[10px] px-1.5 py-0.5">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-destructive text-destructive text-[10px] px-1.5 py-0.5">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin h-7 w-7 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
        <h3 className="text-[14px] font-semibold mb-1">No bookings found</h3>
        <p className="text-[12px] text-muted-foreground">When you make a booking, it will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Card key={booking.id} className="rounded-2xl overflow-hidden">
          <CardContent className="p-3">
            {/* Top row: thumbnail + title + status */}
            <div className="flex gap-2.5 mb-2">
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                {booking.itemImage ? (
                  <img src={booking.itemImage} alt={booking.itemName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary/20">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Title & meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground leading-tight truncate">
                      {booking.cabinId?.cabinCode || booking.cabinCode || booking.itemName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{booking.itemName}</p>
                    {booking.bookingType === 'cabin' && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        Seat #{booking.itemNumber} · {booking.cabinId?.location?.fullAddress}
                      </p>
                    )}
                    {booking.bookingType === 'hostel' && (
                      <p className="text-[10px] text-muted-foreground">Bed #{booking.itemNumber}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {booking.paymentStatus && getStatusBadge(booking.paymentStatus)}
                    {booking.bookingStatus === 'transferred' && (
                      <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px] px-1.5 py-0.5">Transferred</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Timer */}
            {booking.paymentStatus === 'pending' && booking.createdAt && (
              <div className="mb-2">
                <Suspense fallback={<div className="p-2 text-[12px] text-muted-foreground">Loading timer...</div>}>
                  <PaymentTimer
                    createdAt={booking.createdAt}
                    onExpiry={() => handlePaymentExpiry(booking.id)}
                    onRetryPayment={() => handleRetryPayment(booking)}
                    variant="compact"
                    showRetryButton={false}
                  />
                </Suspense>
              </div>
            )}

            {/* Coupon */}
            {booking.appliedCoupon && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-1.5 mb-1">
                  <TicketPercent className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-[11px] font-semibold text-green-700">Coupon: {booking.appliedCoupon.couponCode}</span>
                  <span className="text-[11px] text-green-600 ml-auto">-₹{booking.appliedCoupon.discountAmount}</span>
                </div>
              </div>
            )}

            {/* Dates & amounts — compact 2-col grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-2 bg-muted/40 p-2 rounded-xl">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Booked On</p>
                <p className="text-[11px] text-foreground">{format(new Date(booking.createdAt), 'dd MMM yy')}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Check-in</p>
                <p className="text-[11px] text-foreground">{formatBookingPeriod(booking.startDate, null)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Check-out</p>
                <p className="text-[11px] text-foreground">{formatBookingPeriod(null, booking?.endDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground">Amount</p>
                {booking.originalPrice && booking.appliedCoupon ? (
                  <div>
                    <p className="text-[10px] text-muted-foreground line-through">₹{booking.originalPrice.toLocaleString()}</p>
                    <p className="text-[12px] font-bold text-primary">₹{booking.totalPrice.toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-[12px] font-bold text-primary">₹{booking.totalPrice.toLocaleString()}</p>
                )}
              </div>
              {booking.seatPrice > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Seat Price</p>
                  <p className="text-[11px] text-foreground">₹{booking.seatPrice?.toLocaleString()}</p>
                </div>
              )}
              {booking.keyDeposit > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Key Deposit</p>
                  <p className="text-[11px] text-foreground">₹{booking.keyDeposit?.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Booking expiry */}
            {booking.paymentStatus === 'completed' && (
              <BookingExpiryDetails
                startDate={booking.startDate}
                endDate={booking.endDate}
                status={booking.paymentStatus}
                paymentStatus={booking.paymentStatus}
              />
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-2">
              {booking.paymentStatus === 'pending' && (
                <div className="w-full p-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[11px] text-amber-700 mb-2">Complete payment to confirm booking</p>
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

              {booking.paymentStatus === 'completed' && canRenew(booking) && (
                <Link to={`/student/bookings/${booking.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-[12px] rounded-xl gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    View Details
                  </Button>
                </Link>
              )}

              {booking.paymentStatus === 'pending' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[12px] rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5 gap-1"
                  onClick={() => handleCancelBooking(booking.id)}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
              )}

              {booking.paymentStatus === 'completed' && showRenewalOption && (
                <BookingRenewal
                  booking={booking as any}
                  onRenewalComplete={onBookingRenewed || (() => {})}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
