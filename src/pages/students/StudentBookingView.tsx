import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  CreditCard,
} from "lucide-react";
import { bookingsService } from "@/api/bookingsService";
import { BookingTransactionView } from "@/components/booking/BookingTransactionView";


interface BookingUser {
  name?: string;
  email?: string;
  phone?: string;
}

interface Cabin {
  name: string;
}

interface Seat {
  number?: string | number;
}

interface Hostel {
  name: string;
}

interface Bed {
  number?: string | number;
}

type PaymentStatus = "completed" | "pending" | "failed";

interface BookingDetail {
  _id: string;
  bookingId?: string;
  startDate: string;
  endDate: string;
  bookingDuration: "daily" | "weekly" | "monthly";
  durationCount?: number;
  userId?: BookingUser;
  cabinId?: Cabin;
  seatId?: Seat;
  hostelId?: Hostel;
  bedId?: Bed;
  totalPrice?: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentDate?: string;
}

export default function StudentBookingView() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await bookingsService.getBookingById(bookingId);
        if (response.success) {
          setBooking(response.data as any);
        } else {
          throw new Error(response.error || "Failed to fetch booking details");
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        setError(
          error.message || "An error occurred while fetching booking details"
        );
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, toast]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Unable to load booking details. Please try again."}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/student/bookings")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }
 

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
        <Button
          variant="outline"
          onClick={() => navigate("/student/bookings")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Unable to load booking details. Please try again."}
          </AlertDescription>
        </Alert>
      ) : booking ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
              <CardTitle className="text-xl">
                Booking #{booking.bookingId || booking._id}
              </CardTitle>
              <Badge
                variant={
                  booking.paymentStatus === "completed"
                    ? "default"
                    : booking.paymentStatus === "pending"
                    ? "outline"
                    : "destructive"
                }
              >
                {booking.paymentStatus}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Period */}
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                Booking Period
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-6">
                <li>
                  Start Date:{" "}
                  {format(new Date(booking.startDate), "dd MMM yyyy h:mm:ss a")}
                </li>
                <li>
                  End Date: {format(new Date(booking.endDate), "dd MMM yyyy h:mm:ss a")}
                </li>
                <li>
                  Duration:{" "}
                  {booking.bookingDuration === "daily"
                    ? `${booking.durationCount || 1} day(s)`
                    : booking.bookingDuration === "weekly"
                    ? `${booking.durationCount || 1} week(s)`
                    : `${booking.durationCount || 1} month(s)`}
                </li>
              </ul>
            </div>

            {/* Customer Details */}
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center mb-2">
                <User className="h-4 w-4 mr-2" />
                Customer Details
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 ">
                <li>Name: {booking.userId?.name || "N/A"}</li>
                <li>Email: {booking.userId?.email || "N/A"}</li>
                <li>Phone: {booking.userId?.phone || "N/A"}</li>
              </ul>
            </div>

            {/* Cabin or Hostel Details */}
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center mb-2">
                <MapPin className="h-4 w-4 mr-2" />
                {booking.cabinId
                  ? "Cabin Details"
                  : booking.hostelId
                  ? "Hostel Details"
                  : "Booking Info"}
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-6">
                {booking.cabinId && (
                  <>
                    <li>Cabin: {booking.cabinId.name}</li>
                    <li>Seat #: {booking.seatId?.number || "N/A"}</li>
                  </>
                )}
                {booking.hostelId && (
                  <>
                    <li>Hostel: {booking.hostelId.name}</li>
                    <li>Bed #: {booking.bedId?.number || "N/A"}</li>
                  </>
                )}
              </ul>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center mb-2">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Details
              </h3>
              <ul className="text-sm text-gray-600 space-y-1 ml-6">
                <li>Total: ₹{booking.totalPrice?.toFixed(2) || "0.00"}</li>
                <li>Method: {booking.paymentMethod || "N/A"}</li>
                <li>
                  Date:{" "}
                  {booking.paymentDate
                    ? format(new Date(booking.paymentDate), "dd MMM yyyy")
                    : "N/A"}
                </li>
              </ul>
            </div>
            </CardContent>
            <CardContent className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <BookingTransactionView 
              bookingId={bookingId} 
              booking={booking} 
              bookingType={'cabin'}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-10 text-gray-500 text-sm">
          No booking data found.
        </div>
      )}
    </div>
  );
}
