import React, { useState, useEffect, lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  setSeconds,
  setMinutes,
  setHours,
  subDays,
} from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { bookingsService } from "@/api/bookingsService";
import { RazorpayCheckout } from "@/components/payment/RazorpayCheckout";
import { BookingDuration } from "@/types/BookingTypes";
import { CalendarIcon, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReadingRoomRules from "./ReadingRoomRules";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const PaymentTimer = lazy(() =>
  import("@/components/booking/PaymentTimer").then((m) => ({
    default: m.PaymentTimer,
  }))
);

const DateBasedSeatMap = lazy(() =>
  import("./DateBasedSeatMap").then((m) => ({
    default: m.DateBasedSeatMap,
  }))
);

const CouponSelection = lazy(() =>
  import("@/components/booking/CouponSelection").then((m) => ({
    default: m.CouponSelection,
  }))
);

interface Cabin {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  category?: "standard" | "premium" | "luxury";
  amenities?: string[];
  floors?: {id: string, number: number}[];
  lockerPrice?:number;
  isActive?:boolean;
  isBookingActive?:boolean;
}

export interface RoomElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  rotation?: number;
}

interface Seat {
  _id: string;
  id: string;
  number: number;
  cabinId: string;
  price: number;
  position: {
    x: number;
    y: number;
  };
  isAvailable: boolean;
  isHotSelling?: boolean;
}

interface SeatBookingFormProps {
  cabin: Cabin | null;
  selectedSeat?: Seat | null;
  onBookingComplete?: (bookingId: string) => void;
  hideSeatSelection?: (bookingId: string, status: boolean) => void;
  availableSeats?: {
    id: string;
    seatNumber: string;
    isOccupied: boolean;
    price?: number;
  }[];
  roomElements?: RoomElement[];
}

export const SeatBookingForm: React.FC<SeatBookingFormProps> = ({
  cabin,
  selectedSeat: initialSelectedSeat,
  onBookingComplete = () => {},
  hideSeatSelection = () => {},
  availableSeats = [],
  roomElements = [],
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(
    initialSelectedSeat || null
  );
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [seatPrice, setSeatPrice] = useState<number>(0);
  const [keyDeposit, setKeyDeposit] = useState<number>(cabin.lockerPrice ?? 500);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingCreated, setBookingCreated] = useState<boolean>(false);
  const [bookingId, setBookingId] = useState<string>("");
  const [CHECK_IN_HOUR, setCHECK_IN_HOUR] = useState(9);
  const [CHECK_OUT_HOUR, setCHECK_OUT_HOUR] = useState(18);
  const bookingSuccessRef = useRef<HTMLDivElement | null>(null);


  const [hotSellingPrice, setHotSellingPrice] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState<BookingDuration>({
    type: "monthly",
    count: 1,
    price: 0,
  });
  const [agree, setAgree] = useState<boolean>(false);
  const [bookingCreatedAt, setBookingCreatedAt] = useState<string | null>(null);
  const [showSeatSelection, setShowSeatSelection] = useState<boolean>(false);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [originalPrice, setOriginalPrice] = useState<number>(0);

  const durations: BookingDuration[] = [
    { type: "monthly", count: 1, price: selectedSeat?.price || 0 },
  ];

  const months = [
    { type: "1 Month", count: 1 },
    { type: "2 months", count: 2 },
    { type: "3 Months", count: 3 },
    { type: "6 Months", count: 6 },
  ];

  const daily = [
    { type: "1 Day", count: 1 },
    { type: "2 Days", count: 2 },
    { type: "3 Days", count: 3 },
    { type: "4 Days", count: 4 },
    { type: "5 Days", count: 5 },
    { type: "6 Days", count: 6 },
  ];

  const weekly = [
    { type: "1 Week", count: 1 },
    { type: "2 Weeks", count: 2 },
  ];
  const [selection, setSelection] = useState(months);

  useEffect(() => {
    if (startDate && selectedDuration.count > 0) {
      setShowSeatSelection(true);
    } else {
      setShowSeatSelection(false);
    }
    setSelectedSeat(null);
  }, [startDate, selectedDuration]);

  useEffect(() => {
    if (selectedDuration) {
      let newEndDate: Date | null = null;
      switch (selectedDuration.type) {
        case "daily":
          setSelection(daily);
          newEndDate = addDays(startDate, selectedDuration.count);
          break;
        case "weekly":
          setSelection(weekly);
          newEndDate = addWeeks(startDate, selectedDuration.count);
          break;
        case "monthly": {
          setSelection(months);
          const rawEndDate = addMonths(startDate, selectedDuration.count);
          const endDate = subDays(rawEndDate, 1);
          newEndDate = setSeconds(setMinutes(setHours(endDate, 23), 59), 59);
          break;
        }
        default:
          setSelection(months);
          newEndDate = addMonths(startDate, 1);
      }

      setEndDate(newEndDate);

      if (selectedSeat) {
        let basePrice = 0;

        switch (selectedDuration.type) {
          case "daily":
            basePrice = (selectedSeat.price / 30) * selectedDuration.count;
            break;
          case "weekly":
            basePrice = (selectedSeat.price / 4) * selectedDuration.count;
            break;
          case "monthly":
            basePrice = selectedSeat.price * selectedDuration.count;
            break;
        }

        const hotSellingMarkup = selectedSeat.isHotSelling
          ? basePrice * 0.05
          : 0;

        const finalSeatPrice = basePrice + hotSellingMarkup;
        setHotSellingPrice(hotSellingMarkup);
        setSeatPrice(Math.round(finalSeatPrice * 100) / 100);
        
        const totalWithoutCoupon = Math.round((finalSeatPrice + keyDeposit) * 100) / 100;
        setOriginalPrice(totalWithoutCoupon);
        
        // Apply coupon discount if exists
        if (appliedCoupon) {
          const discountedTotal = totalWithoutCoupon - appliedCoupon.discountAmount;
          setTotalPrice(Math.max(0, discountedTotal));
        } else {
          setTotalPrice(totalWithoutCoupon);
        }
      }
    }
  }, [selectedSeat, selectedDuration, startDate, keyDeposit, appliedCoupon]);

  useEffect(() => {
    if (startDate) {
      let newEndDate: Date | null = null;
      switch (selectedDuration.type) {
        case "daily":
          setSelection(daily);
          newEndDate = addDays(startDate, selectedDuration.count);
          break;
        case "weekly":
          setSelection(weekly);
          newEndDate = addWeeks(startDate, selectedDuration.count);
          break;
        case "monthly": {
          setSelection(months);
          const rawEndDate = addMonths(startDate, selectedDuration.count);
          const endDate = subDays(rawEndDate, 1);
          newEndDate = setSeconds(setMinutes(setHours(endDate, 23), 59), 59);
          break;
        }
        default:
          setSelection(months);
          newEndDate = addMonths(startDate, 1);
      }

      setEndDate(newEndDate);
    }
  }, []);

  const handleDurationTypeChange = (type: "daily" | "weekly" | "monthly") => {
    setSelection(months);
    setSelectedDuration({
      ...selectedDuration,
      type,
      count: 1,
    });
  };

  const handleDurationCountChange = (months) => {
    const count = parseInt(months, 10);
    if (count > 0) {
      setSelectedDuration({
        ...selectedDuration,
        count,
      });
    }
  };

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeat(seat);
  };

  const handleCouponApply = (couponData) => {
    setAppliedCoupon(couponData);
    const discountedTotal = originalPrice - couponData.discountAmount;
    setTotalPrice(Math.max(0, discountedTotal));
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
    setTotalPrice(originalPrice);
  };

  const handleCreateBooking = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to book a seat",
        variant: "destructive",
      });
      const loginPath = `/student/login?from=${encodeURIComponent(
        location.pathname
      )}`;
      navigate(loginPath);
      return;
    }

    if (!cabin || !selectedSeat || !startDate || !endDate) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all the required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await bookingsService.createBooking({
        cabin_id: cabin._id || cabin.id || "",
        seat_number: selectedSeat.number,
        start_date: format(withFixedTime(startDate, CHECK_IN_HOUR), 'yyyy-MM-dd'),
        end_date: format(withFixedTime(endDate, CHECK_OUT_HOUR), 'yyyy-MM-dd'),
        booking_duration: selectedDuration.type,
        duration_count: String(selectedDuration.count),
        total_price: totalPrice,
        payment_status: "pending",
      });

      if (response.success && response.data) {
        toast({
          title: "Booking Created",
          description: "Your booking has been created successfully",
        });
        setBookingCreated(true);
        setBookingId((response.data as any).id || '');
        setBookingCreatedAt(new Date().toISOString());
        hideSeatSelection(bookingId, true);
        setTimeout(() => {
          bookingSuccessRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 100); // small delay to ensure DOM is updated

      } else {
        throw new Error(response.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking Failed",
        description:
          error.response || "Failed to create your booking Seat Not Available",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: "Your booking has been confirmed!",
    });
    onBookingComplete(bookingId);
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    toast({
      title: "Payment Failed",
      description: "There was an issue with your payment. Please try again.",
      variant: "destructive",
    });
  };

  const handlePaymentExpiry = () => {
    setBookingCreated(false);
    setBookingCreatedAt(null);
    toast({
      title: "Booking Expired",
      description: "Your booking has expired. Please try again.",
      variant: "destructive",
    });
  };

  const withFixedTime = (date: Date, hour: number) => {
    return setSeconds(setMinutes(setHours(date, hour), 0), 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Details</CardTitle>
      </CardHeader>
      <CardContent>
        {!bookingCreated ? (
          <div className="space-y-6">
            {/* Step 1: Date and Duration Selection */}
            <div>
              <Label className="block mb-2">Booking Duration</Label>
              <RadioGroup
                value={selectedDuration.type}
                onValueChange={(value: "daily" | "weekly" | "monthly") =>
                  handleDurationTypeChange(value)
                }
                className="flex flex-col space-y-3"
              >
                {durations.map((option) => (
                  <div
                    key={option.type}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={option.type} id={option.type} />
                    <Label htmlFor={option.type} className="flex-1">
                      {option.type.charAt(0).toUpperCase() +
                        option.type.slice(1)}
                      <span className="text-muted-foreground text-xs ml-1">
                        (Base rate per{" "}
                        {option.type == "daily"
                          ? "Day"
                          : option.type.slice(0, -2)}
                        )
                      </span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-32">
                <Label htmlFor="durationCount" className="block mb-1">
                  {selectedDuration.type == "daily"
                    ? "Days"
                    : selectedDuration.type == "monthly"
                    ? "Months"
                    : "Weeks"}
                </Label>

                <Select
                  value={selectedDuration.count + ""}
                  onValueChange={handleDurationCountChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {selection.map((month) => (
                      <SelectItem key={month.type} value={month.count + ""}>
                        {month.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label className="block mb-1">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      initialFocus
                      disabled={(date) => {
                        const today = new Date();
                        const tenDaysFromNow = new Date();

                        today.setUTCHours(0, 0, 0, 0);
                        tenDaysFromNow.setDate(today.getDate() + 4);

                        return date < today || date > tenDaysFromNow;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label className="block mb-1">End Date</Label>
              <div className="p-2 border rounded bg-muted/30">
                {endDate
                  ? format(endDate, "PPP")
                  : "Will be calculated based on duration"}
              </div>
            </div>

            {/* Step 2: Seat Selection */}
            {showSeatSelection && cabin && (
              <div className="space-y-4">
                <Separator />
                  <Label className="block mb-4 text-lg font-semibold">
                    Select Your Seat
                  </Label>
                  <Suspense fallback={<div className="p-3 text-sm text-muted-foreground">Loading seat map...</div>}>
                    <DateBasedSeatMap 
                      cabinId={cabin._id || cabin.id || ""}
                      floorsList={cabin.floors}
                      onSeatSelect={handleSeatSelect}
                      selectedSeat={selectedSeat}
                      exportcsv={false}
                      startDate={startDate}
                      endDate={endDate}
                      roomElements={roomElements}
                    />
                  </Suspense>
              </div>
            )}

            {/* Step 3: Coupon Selection - Only show after seat selection */}
            {selectedSeat && cabin.isBookingActive && (
              <>
                <Separator />

                <Suspense fallback={<div className="p-3 text-sm text-muted-foreground">Loading coupons...</div>}>
                  <CouponSelection 
                    bookingType="cabin"
                    bookingAmount={originalPrice}
                    cabinId={cabin?._id || cabin?.id}
                    onCouponApply={handleCouponApply}
                    onCouponRemove={handleCouponRemove}
                    appliedCoupon={appliedCoupon} 
                  />
                </Suspense>
              </>
            )}

            {/* Step 4: Booking Summary and Confirmation */}
            {selectedSeat && cabin.isBookingActive ? (
              <>
                <Separator />

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    A key deposit of ₹{keyDeposit} is required for all new
                    bookings. This deposit will be refunded when you vacate the
                    seat.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Selected Seat:</span>
                    <span>#{selectedSeat.number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seat Price:</span>
                    <span>₹{Math.round(selectedSeat?.price || 0)} / month</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Key Deposit:</span>
                    <span>+ ₹{keyDeposit}</span>
                  </div>
                  {selectedSeat?.isHotSelling && (
                    <div className="flex justify-between text-pink-600">
                      <span>Hot Selling Premium (5%):</span>
                      <span>+ ₹{hotSellingPrice}</span>
                    </div>
                  )}
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount ({appliedCoupon.coupon.code}):</span>
                      <span>- ₹{appliedCoupon.discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-medium text-lg">
                    <span>Total Amount:</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleCreateBooking}
                  disabled={isSubmitting || !selectedSeat}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    "Confirm & Proceed to Payment"
                  )}
                </Button>
              </>
            ):(
             !cabin.isBookingActive && (
                <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
                  <AlertTitle className="font-semibold">
                    Bookings Disabled
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    This cabin is currently not accepting new bookings. Please check back later.
                  </AlertDescription>
                </Alert>
              )
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div ref={bookingSuccessRef} className="rounded-lg p-4 bg-green-50 border border-green-200 text-green-800">
              <h3 className="font-medium mb-1">
                Booking Created Successfully!
              </h3>
              <p className="text-sm">
                Please complete the payment to confirm your booking.
              </p>
            </div>
            {bookingCreatedAt && (
              <div className="mb-4">
                <Suspense fallback={<div className="p-3 text-sm text-muted-foreground">Loading payment timer...</div>}>
                  <PaymentTimer 
                    createdAt={bookingCreatedAt}
                    onExpiry={handlePaymentExpiry}
                    variant="full" 
                  />
                </Suspense>
                <p className="text-sm text-amber-700 mt-2">
                  Complete your payment before the timer expires or your booking
                  will be cancelled.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Room:</span>
                <span>{cabin?.name || "Selected Room"}</span>
              </div>
              <div className="flex justify-between">
                <span>Seat Number:</span>
                <span>#{selectedSeat?.number || ""}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>
                  {selectedDuration.count} {selectedDuration.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span>From:</span>
                <span>
                  {startDate
                    ? format(withFixedTime(startDate, CHECK_IN_HOUR), "dd MMM yyyy hh:mm:ss a")
                    : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span>To:</span>
                <span>
                  {endDate
                    ? format(withFixedTime(endDate, CHECK_OUT_HOUR), "dd MMM yyyy hh:mm:ss a")
                    : ""}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span>Seat Price:</span>
                <span>₹{seatPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-blue-600">
                <span>Key Deposit:</span>
                <span>₹{keyDeposit}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon Discount:</span>
                  <span>-₹{appliedCoupon.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-lg pt-2">
                <span>Total Price:</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <div>
                <ReadingRoomRules />
              </div>
              <div>
                <Checkbox
                  checked={agree}
                  onCheckedChange={() => setAgree((prev) => !prev)}
                />
                <span className="mb-3 ml-2 text-sm">I agree to the terms</span>
              </div>
            </div>
            <div className="flex justify-center">
              <RazorpayCheckout
                appliedCoupon={appliedCoupon}
                amount={totalPrice}
                bookingId={bookingId}
                bookingType="cabin"
                endDate={endDate}
                bookingDuration={selectedDuration.type}
                durationCount={selectedDuration.count}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentError}
                buttonText="Complete Payment"
                buttonDisabled={!agree}
                buttonVariant="default"
                className="px-8"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
