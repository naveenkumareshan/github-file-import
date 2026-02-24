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

interface BookingDetail {
  _id: string;
  bookingId?: string;
  startDate: string;
  endDate: string;
  bookingDuration: "daily" | "weekly" | "monthly";
  durationCount?: number;
  userId?: { name?: string; email?: string; phone?: string };
  cabinId?: { name: string };
  seatId?: { number?: string | number };
  hostelId?: { name: string };
  bedId?: { number?: string | number };
  totalPrice?: number;
  paymentStatus: "completed" | "pending" | "failed";
  paymentMethod?: string;
  paymentDate?: string;
}

// Map snake_case Supabase response to camelCase BookingDetail
const mapBookingData = (raw: any): BookingDetail => {
  return {
    _id: raw.id || raw._id,
    bookingId: raw.booking_id || raw.bookingId || raw.id,
    startDate: raw.start_date || raw.startDate,
    endDate: raw.end_date || raw.endDate,
    bookingDuration: raw.booking_duration || raw.bookingDuration || "monthly",
    durationCount: raw.duration_count ? Number(raw.duration_count) : (raw.durationCount || 1),
    userId: raw.userId || null,
    cabinId: raw.cabins ? { name: raw.cabins.name } : (raw.cabinId || null),
    seatId: raw.seat_number ? { number: raw.seat_number } : (raw.seatId || null),
    hostelId: raw.hostelId || null,
    bedId: raw.bedId || null,
    totalPrice: raw.total_price ?? raw.totalPrice ?? 0,
    paymentStatus: raw.payment_status || raw.paymentStatus || "pending",
    paymentMethod: raw.payment_method || raw.paymentMethod || null,
    paymentDate: raw.payment_date || raw.paymentDate || raw.created_at || null,
  };
};

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
        if (response.success && response.data) {
          setBooking(mapBookingData(response.data));
        } else {
          throw new Error("Failed to fetch booking details");
        }
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        setError(err.message || "An error occurred while fetching booking details");
        toast({ title: "Error", description: "Failed to load booking details", variant: "destructive" });
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
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
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
          <AlertDescription>{error || "Unable to load booking details."}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/student/bookings")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const safeFormatDate = (dateStr: string, fmt: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "N/A";
      return format(d, fmt);
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-2xl font-bold text-foreground">Booking Details</h1>
        <Button variant="outline" onClick={() => navigate("/student/bookings")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
            <CardTitle className="text-xl">
              Booking #{booking.bookingId || booking._id}
            </CardTitle>
            <Badge
              variant={
                booking.paymentStatus === "completed" ? "default"
                  : booking.paymentStatus === "pending" ? "outline"
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
            <h3 className="font-semibold text-foreground flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2" /> Booking Period
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>Start: {safeFormatDate(booking.startDate, "dd MMM yyyy")}</li>
              <li>End: {safeFormatDate(booking.endDate, "dd MMM yyyy")}</li>
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

          {/* Cabin / Hostel Details */}
          <div>
            <h3 className="font-semibold text-foreground flex items-center mb-2">
              <MapPin className="h-4 w-4 mr-2" />
              {booking.cabinId ? "Cabin Details" : booking.hostelId ? "Hostel Details" : "Booking Info"}
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
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
            <h3 className="font-semibold text-foreground flex items-center mb-2">
              <CreditCard className="h-4 w-4 mr-2" /> Payment Details
            </h3>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li>Total: ₹{booking.totalPrice?.toFixed(2) || "0.00"}</li>
              <li>Method: {booking.paymentMethod || "N/A"}</li>
              <li>Date: {booking.paymentDate ? safeFormatDate(booking.paymentDate, "dd MMM yyyy") : "N/A"}</li>
            </ul>
          </div>
        </CardContent>

        <CardContent>
          <BookingTransactionView
            bookingId={bookingId}
            booking={booking}
            bookingType="cabin"
          />
        </CardContent>
      </Card>
    </div>
  );
}
