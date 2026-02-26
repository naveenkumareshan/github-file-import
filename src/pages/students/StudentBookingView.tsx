import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Loader2,
  ChevronDown,
  ChevronUp,
  Receipt,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ReceiptItem {
  id: string;
  amount: number;
  payment_method: string;
  created_at: string;
  serial_number: string | null;
  receipt_type: string;
  notes: string;
  transaction_id: string;
}

const safeFmt = (dateStr: string | null, fmt: string) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return format(d, fmt);
  } catch {
    return "N/A";
  }
};

function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3.5 text-left">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[13px] font-semibold text-foreground">{title}</span>
            </div>
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3.5 pb-3.5 pt-0">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[12px] font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

export default function StudentBookingView() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;
    (async () => {
      try {
        setLoading(true);
        const [bookingRes, receiptsRes] = await Promise.all([
          supabase
            .from("bookings")
            .select("*, cabins(name), seats:seat_id(price, number, category)")
            .eq("id", bookingId)
            .single(),
          supabase
            .from("receipts")
            .select("*")
            .eq("booking_id", bookingId)
            .order("created_at", { ascending: false }),
        ]);

        if (bookingRes.error || !bookingRes.data) throw new Error("Not found");
        setBooking(bookingRes.data);
        setReceipts((receiptsRes.data as ReceiptItem[]) || []);
      } catch {
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

  // Derived values
  const cabinName = booking.cabins?.name || "Reading Room";
  const seatNumber = booking.seats?.number || booking.seat_number || 0;
  const seatPrice = booking.seats?.price ?? (booking.total_price - (booking.locker_included ? booking.locker_price : 0));
  const totalPrice = booking.total_price || 0;
  const lockerIncluded = booking.locker_included || false;
  const lockerPrice = booking.locker_price || 0;
  const discountAmount = booking.discount_amount || 0;

  const totalPaid = receipts.reduce((s, r) => s + Number(r.amount), 0);
  const dueRemaining = Math.max(0, totalPrice - totalPaid);

  const endDate = booking.end_date ? new Date(booking.end_date) : null;
  const daysLeft = endDate ? differenceInDays(endDate, new Date()) : 0;

  const paymentStatus =
    dueRemaining === 0 ? "Completed" : daysLeft <= 0 ? "Overdue" : "Partial";

  const paymentBadgeVariant =
    paymentStatus === "Completed" ? "success" : paymentStatus === "Overdue" ? "destructive" : "outline";

  const durationLabel =
    booking.booking_duration === "daily"
      ? `${booking.duration_count || 1} day(s)`
      : booking.booking_duration === "weekly"
      ? `${booking.duration_count || 1} week(s)`
      : `${booking.duration_count || 1} month(s)`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
              {booking.serial_number && (
                <p className="text-[11px] text-white/70 mt-0.5">{booking.serial_number}</p>
              )}
            </div>
            <Badge variant={paymentBadgeVariant} className="text-[10px] capitalize">
              {paymentStatus}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-3 -mt-2 pb-6 space-y-3">
        {/* Booking Info */}
        <CollapsibleSection title="Booking Info" icon={MapPin}>
          <InfoRow label="Reading Room" value={cabinName} />
          <InfoRow label="Seat Number" value={`#${seatNumber}`} />
          <InfoRow label="Booking ID" value={booking.serial_number || booking.id?.slice(0, 8)} />
          <InfoRow label="Check-in" value={safeFmt(booking.start_date, "dd MMM yyyy")} />
          <InfoRow label="Check-out" value={safeFmt(booking.end_date, "dd MMM yyyy")} />
          <InfoRow label="Duration" value={durationLabel} />
          <InfoRow label="Booked On" value={safeFmt(booking.created_at, "dd MMM yyyy")} />
        </CollapsibleSection>

        {/* Payment Summary */}
        <CollapsibleSection title="Payment Summary" icon={CreditCard}>
          <InfoRow label="Seat Price" value={`₹${Number(seatPrice).toFixed(2)}`} />
          {lockerIncluded && <InfoRow label="Locker" value={`₹${Number(lockerPrice).toFixed(2)}`} />}
          {discountAmount > 0 && (
            <InfoRow label="Discount" value={<span className="text-green-600">-₹{Number(discountAmount).toFixed(2)}</span>} />
          )}
          <InfoRow label="Total Price" value={<span className="font-bold">₹{Number(totalPrice).toFixed(2)}</span>} />
          <InfoRow label="Total Paid" value={<span className="text-green-600">₹{totalPaid.toFixed(2)}</span>} />
          <InfoRow
            label="Due Remaining"
            value={
              <span className={dueRemaining > 0 ? "text-destructive font-bold" : "text-green-600"}>
                ₹{dueRemaining.toFixed(2)}
              </span>
            }
          />
          <InfoRow
            label="Payment Status"
            value={
              <Badge variant={paymentBadgeVariant} className="text-[10px]">
                {paymentStatus}
              </Badge>
            }
          />
          {dueRemaining > 0 && (
            <div className="mt-3">
              <Button
                size="sm"
                className="w-full text-[12px]"
                onClick={() =>
                  toast({
                    title: "Pay Due",
                    description: "Please contact the reading room to clear your dues.",
                  })
                }
              >
                Pay Due ₹{dueRemaining.toFixed(2)}
              </Button>
            </div>
          )}
        </CollapsibleSection>

        {/* Payment Receipts */}
        <CollapsibleSection title={`Payment Receipts (${receipts.length})`} icon={Receipt} defaultOpen={false}>
          {receipts.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">No receipts found.</p>
          ) : (
            <div className="space-y-2">
              {receipts.map((r) => (
                <div key={r.id} className="border rounded-xl p-2.5 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-semibold text-foreground">₹{Number(r.amount).toFixed(2)}</span>
                    <span className="text-[10px] text-muted-foreground">{safeFmt(r.created_at, "dd MMM yyyy")}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground capitalize">{r.payment_method}</span>
                    {r.serial_number && (
                      <span className="text-[10px] text-muted-foreground">• {r.serial_number}</span>
                    )}
                  </div>
                  {r.notes && <p className="text-[10px] text-muted-foreground mt-1">{r.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
