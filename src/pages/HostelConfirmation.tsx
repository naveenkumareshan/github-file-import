import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { hostelBookingService } from "@/api/hostelBookingService";
import { formatCurrency } from "@/utils/currency";

const HostelConfirmation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const data = await hostelBookingService.getBookingById(bookingId!);
      setBooking(data);
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast({
        title: "Error",
        description: "Failed to load booking details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not specified";
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-7 w-7 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-accent/30">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-background rounded-lg shadow-md overflow-hidden">
          <div
            className={`p-6 text-white text-center ${
              booking?.payment_status === "completed" || booking?.payment_status === "advance_paid"
                ? "bg-green-600"
                : "bg-amber-500"
            }`}
          >
            {booking?.payment_status === "completed" || booking?.payment_status === "advance_paid" ? (
              <>
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
                <p className="mt-2">Your hostel room has been successfully reserved.</p>
              </>
            ) : (
              <>
                <svg
                  className="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h1 className="text-3xl font-bold">Booking Pending</h1>
                <p className="mt-2">Your payment was not completed. Please try again later.</p>
              </>
            )}
          </div>

          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Hostel</p>
                  <p className="font-medium">{booking?.hostels?.name || 'N/A'}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
                  <p className="font-medium">{booking?.serial_number || booking?.id}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Room Number</p>
                  <p className="font-medium">{booking?.hostel_rooms?.room_number || 'N/A'}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Bed Number</p>
                  <p className="font-medium">{booking?.hostel_beds?.bed_number || 'N/A'}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Sharing Type</p>
                  <p className="font-medium">{booking?.hostel_sharing_options?.type || 'N/A'}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="font-medium">
                    {booking?.duration_count || 1} {booking?.booking_duration || 'month'}(s)
                  </p>
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                  <p className="font-medium">{formatDate(booking?.start_date)}</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">End Date</p>
                  <p className="font-medium">{formatDate(booking?.end_date)}</p>
                </div>

                <div className={`p-4 rounded-md ${
                  booking?.payment_status === "completed" || booking?.payment_status === "advance_paid"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : booking?.payment_status === "failed"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}>
                  <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                  <p className="font-medium capitalize">{booking?.payment_status || "Pending"}</p>
                </div>

                {booking?.total_price > 0 && (
                  <div className="bg-muted/30 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="font-medium">{formatCurrency(booking.total_price)}</p>
                  </div>
                )}

                {booking?.advance_amount > 0 && (
                  <div className="bg-muted/30 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Advance Paid</p>
                    <p className="font-medium">{formatCurrency(booking.advance_amount)}</p>
                  </div>
                )}

                {booking?.remaining_amount > 0 && (
                  <div className="bg-muted/30 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Remaining Amount</p>
                    <p className="font-medium">{formatCurrency(booking.remaining_amount)}</p>
                  </div>
                )}

                {booking?.security_deposit > 0 && (
                  <div className="bg-muted/30 p-4 rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Security Deposit</p>
                    <p className="font-medium">{formatCurrency(booking.security_deposit)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors text-center"
              >
                Back to Home
              </Link>
              <Link
                to="/student/dashboard"
                className="bg-secondary text-secondary-foreground px-6 py-3 rounded-md font-medium hover:bg-secondary/80 transition-colors text-center"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => window.print()}
                className="bg-background border border-border px-6 py-3 rounded-md font-medium hover:bg-muted transition-colors"
              >
                Print Confirmation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostelConfirmation;
