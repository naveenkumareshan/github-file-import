import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Clock,
  Loader2,
} from "lucide-react";
import { bookingsService } from "@/api/bookingsService";
import { BookingTransactionView } from "@/components/booking/BookingTransactionView";

interface BookingDetail {
  _id: string;
  bookingId?: string;
  serialNumber?: string;
  startDate: string;
  endDate: string;
  bookingDuration: "daily" | "weekly" | "monthly";
  durationCount?: number;
  cabinName?: string;
  seatNumber?: number;
  totalPrice?: number;
  paymentStatus: "completed" | "pending" | "failed";
  paymentMethod?: string;
  paymentDate?: string;
}

const mapBookingData = (raw: any): BookingDetail => ({
  _id: raw.id || raw._id,
  bookingId: raw.booking_id || raw.bookingId || raw.id,
  serialNumber: raw.serial_number || null,
  startDate: raw.start_date || raw.startDate,
  endDate: raw.end_date || raw.endDate,
  bookingDuration: raw.booking_duration || raw.bookingDuration || "monthly",
  durationCount: raw.duration_count ? Number(raw.duration_count) : (raw.durationCount || 1),
  cabinName: raw.cabins?.name || "Reading Room",
  seatNumber: raw.seat_number || raw.seatNumber || 0,
  totalPrice: raw.total_price ?? raw.totalPrice ?? 0,
  paymentStatus: raw.payment_status || raw.paymentStatus || "pending",
  paymentMethod: raw.payment_method || raw.paymentMethod || null,
  paymentDate: raw.payment_date || raw.paymentDate || raw.created_at || null,
});

const safeFmt = (dateStr: string, fmt: string) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, fmt);
  } catch {
    return "N/A";
  }
};

const statusColor = (s: string) =>
  s === "completed" ? "default" : s === "pending" ? "outline" : "destructive";

export default function StudentBookingView() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await bookingsService.getBookingById(bookingId);
        if (res.success && res.data) setBooking(mapBookingData(res.data));
        else throw new Error("Not found");
      } catch (err: any) {
        toast({ title: "Error", description: "Failed to load booking", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-muted-foreground text-[13px] mb-3">Booking not found.</p>
        <button onClick={() => navigate("/student/bookings")} className="text-primary text-[13px] underline">
          ← Back to Bookings
        </button>
      </div>
    );
  }

  const durationLabel =
    booking.bookingDuration === "daily"
      ? `${booking.durationCount || 1} day(s)`
      : booking.bookingDuration === "weekly"
      ? `${booking.durationCount || 1} week(s)`
      : `${booking.durationCount || 1} month(s)`;

  return (
    <div className="min-h-screen bg-background">
      {/* Compact header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 pt-3 pb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/student/bookings")}
            className="flex items-center gap-1 text-white/80 text-[12px] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[16px] font-bold">Booking Details</h1>
              {booking.serialNumber && (
                <p className="text-[11px] text-white/70 mt-0.5">{booking.serialNumber}</p>
              )}
            </div>
            <Badge variant={statusColor(booking.paymentStatus)} className="text-[10px] capitalize">
              {booking.paymentStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-3 -mt-2 pb-6 space-y-3">
        {/* Main info card */}
        <div className="bg-card rounded-2xl border shadow-sm p-3.5 space-y-3">
          {/* Cabin & Seat */}
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{booking.cabinName}</p>
              <p className="text-[11px] text-muted-foreground">Seat #{booking.seatNumber || "N/A"}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] text-foreground">
                {safeFmt(booking.startDate, "dd MMM yyyy")} → {safeFmt(booking.endDate, "dd MMM yyyy")}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> {durationLabel}
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">₹{booking.totalPrice?.toFixed(2) || "0.00"}</p>
              <p className="text-[11px] text-muted-foreground">
                {booking.paymentMethod || "Online"} • {booking.paymentDate ? safeFmt(booking.paymentDate, "dd MMM yyyy") : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-card rounded-2xl border shadow-sm p-3.5">
          <BookingTransactionView
            bookingId={bookingId}
            booking={booking}
            bookingType="cabin"
          />
        </div>
      </div>
    </div>
  );
}
