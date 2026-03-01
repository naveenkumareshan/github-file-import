import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { addDays, addWeeks, addMonths, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { hostelService } from "@/api/hostelService";
import { hostelRoomService } from "@/api/hostelRoomService";
import { hostelBedCategoryService, HostelBedCategory } from "@/api/hostelBedCategoryService";
import { hostelBookingService } from "@/api/hostelBookingService";
import { razorpayService } from "@/api/razorpayService";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  ArrowLeft,
  Bed,
  Building,
  CalendarIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  IndianRupee,
  MapPin,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CabinImageSlider } from "@/components/CabinImageSlider";
import { getImageUrl } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import { HostelBedMap } from "@/components/hostels/HostelBedMap";
import { StayDurationPackages } from "@/components/hostels/StayDurationPackages";
import { StayPackage, DurationType } from "@/api/hostelStayPackageService";

/* ─── Skeleton ─── */
const HostelDetailSkeleton = () => (
  <div className="min-h-screen bg-background pb-24">
    <Skeleton className="w-full aspect-[4/3]" />
    <div className="px-3 pt-3 space-y-2">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="px-3 pt-3 flex gap-2">
      <Skeleton className="h-8 w-24 rounded-full" />
      <Skeleton className="h-8 w-20 rounded-full" />
      <Skeleton className="h-8 w-28 rounded-full" />
    </div>
    <div className="px-3 pt-4 space-y-3">
      <Skeleton className="h-[120px] w-full rounded-xl" />
      <Skeleton className="h-[200px] w-full rounded-xl" />
    </div>
  </div>
);

/* ─── Gender helpers ─── */
const getGenderColor = (gender: string) => {
  switch (gender?.toLowerCase()) {
    case "male": return "bg-blue-500/90 text-white";
    case "female": return "bg-pink-500/90 text-white";
    default: return "bg-purple-500/90 text-white";
  }
};
const getGenderChipColor = (gender: string) => {
  switch (gender?.toLowerCase()) {
    case "male": return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
    case "female": return "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20";
    default: return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
  }
};

const HostelRoomDetails = () => {
  const { roomId: hostelId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, authChecked } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const bedMapRef = useRef<HTMLDivElement>(null);

  const [rooms, setRooms] = useState<any[]>([]);
  const [hostel, setHostel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  // Selection state
  const [sharingFilter, setSharingFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [selectedStayPackage, setSelectedStayPackage] = useState<StayPackage | null>(null);
  const [durationType, setDurationType] = useState<DurationType>('monthly');
  const [durationCount, setDurationCount] = useState<number>(1);
  const [showDetails, setShowDetails] = useState(true);
  const [categories, setCategories] = useState<HostelBedCategory[]>([]);

  // Check-in date state
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Step 5: Review & Pay state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [useAdvancePayment, setUseAdvancePayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const isUUID = (s: string) => /^[0-9a-f]{8}-/.test(s);

  /* ─── Data fetch ─── */
  useEffect(() => {
    const fetchData = async () => {
      if (!hostelId || fetchedRef.current) return;
      try {
        fetchedRef.current = true;
        setLoading(true);
        setError(null);
        const hostelData = isUUID(hostelId)
          ? await hostelService.getHostelById(hostelId)
          : await hostelService.getHostelBySerialNumber(hostelId);
        const resolvedId = hostelData.id;
        const [roomsData, catResult] = await Promise.all([
          hostelRoomService.getHostelRooms(resolvedId),
          hostelBedCategoryService.getCategories(resolvedId),
        ]);
        setHostel(hostelData);
        setRooms(roomsData || []);
        if (catResult.success) setCategories(catResult.data);
      } catch (err) {
        console.error("Error fetching hostel details:", err);
        setError("Failed to load hostel details");
        toast({ title: "Error", description: "Failed to load hostel details", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hostelId]);

  /* ─── Collapse hero when a bed is selected ─── */
  useEffect(() => {
    if (selectedBed) setShowDetails(false);
  }, [selectedBed]);

  /* ─── IntersectionObserver: re-show hero when scrolled to top ─── */
  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !showDetails) setShowDetails(true); },
      { threshold: 0.3 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, [showDetails]);

  /* ─── Sharing types from rooms ─── */
  const sharingTypes = useMemo(() => {
    const types = new Set<string>();
    rooms.forEach(room => {
      room.hostel_sharing_options?.forEach((opt: any) => {
        if (opt.type) types.add(opt.type);
      });
    });
    return Array.from(types);
  }, [rooms]);

  /* ─── Allowed durations from hostel config ─── */
  const allowedDurations = useMemo<DurationType[]>(() => {
    const allowed = hostel?.allowed_durations;
    if (Array.isArray(allowed) && allowed.length > 0) return allowed as DurationType[];
    return ['daily', 'weekly', 'monthly'];
  }, [hostel?.allowed_durations]);

  const advanceApplicableDurations = useMemo<string[]>(() => {
    const applicable = hostel?.advance_applicable_durations;
    if (Array.isArray(applicable) && applicable.length > 0) return applicable;
    return ['daily', 'weekly', 'monthly'];
  }, [hostel?.advance_applicable_durations]);

  const maxAdvanceBookingDays = hostel?.max_advance_booking_days ?? 30;

  /* ─── Handlers ─── */
  const handleSharingFilterChange = (val: string) => {
    setSharingFilter(val);
    setSelectedBed(null);
    setSelectedStayPackage(null);
    setAgreedToTerms(false);
    setUseAdvancePayment(false);
  };

  const handleCategoryFilterChange = (val: string) => {
    setCategoryFilter(val);
    setSelectedBed(null);
    setSelectedStayPackage(null);
    setAgreedToTerms(false);
    setUseAdvancePayment(false);
  };

  const handleCheckInDateChange = (date: Date | undefined) => {
    if (date) {
      setCheckInDate(date);
      setSelectedBed(null);
      setCalendarOpen(false);
    }
  };

  const handleBedSelect = (bed: any) => {
    setSelectedBed(bed);
    setTimeout(() => {
      bedMapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  /* ─── Razorpay ─── */
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /* ─── Derived references (moved before payment handler) ─── */
  const selectedRoom = selectedBed ? rooms.find(r =>
    r.hostel_sharing_options?.some((opt: any) => opt.id === selectedBed.sharing_option_id)
  ) : null;
  const selectedSharingOption = selectedRoom?.hostel_sharing_options?.find((opt: any) => opt.id === selectedBed?.sharing_option_id);

  const endDate = durationType === 'daily' ? addDays(checkInDate, durationCount)
    : durationType === 'weekly' ? addWeeks(checkInDate, durationCount)
    : addMonths(checkInDate, durationCount);

  /* ─── Payment handler ─── */
  const handleProceedToPayment = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Login Required", description: "Please log in to complete the booking", variant: "destructive" });
      navigate('/student/login', { state: { from: location.pathname } });
      return;
    }
    if (!selectedBed || !hostel || !selectedRoom || !selectedSharingOption) return;

    try {
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast({ title: "Payment Failed", description: "Unable to load payment SDK.", variant: "destructive" });
        return;
      }
      setIsProcessing(true);

      const bookingData = {
        hostel_id: hostel.id,
        room_id: selectedRoom.id,
        bed_id: selectedBed.id,
        sharing_option_id: selectedSharingOption.id,
        start_date: format(checkInDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        booking_duration: durationType as 'daily' | 'weekly' | 'monthly',
        duration_count: durationCount,
        total_price: totalPrice,
        advance_amount: (useAdvancePayment && advanceAmount) ? advanceAmount : 0,
        remaining_amount: (useAdvancePayment && advanceAmount) ? totalPrice - advanceAmount : 0,
        security_deposit: hostel.security_deposit || 0,
        payment_method: 'online',
      };

      const booking = await hostelBookingService.createBooking(bookingData);

      const orderResponse = await razorpayService.createOrder({
        amount: payableAmount,
        currency: 'INR',
        bookingId: booking.id,
        bookingType: 'hostel',
        bookingDuration: durationType,
        durationCount,
        notes: { hostelId: hostel.id, roomId: selectedRoom.id, sharingType: selectedSharingOption.type },
      });

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.error?.message || 'Failed to create order');
      }

      const order = orderResponse.data;

      if (order.testMode) {
        const verifyResponse = await razorpayService.verifyPayment({
          razorpay_payment_id: `test_pay_${Date.now()}`,
          razorpay_order_id: order.id,
          razorpay_signature: 'test_signature',
          bookingId: booking.id,
          bookingType: 'hostel',
        });
        if (verifyResponse.success) {
          toast({ title: "Booking Confirmed!", description: "Your hostel booking has been confirmed (Test Mode)" });
          navigate(`/hostel-confirmation/${booking.id}`);
        } else { throw new Error('Test payment verification failed'); }
        return;
      }

      const rzpOptions = {
        key: order.KEY_ID,
        amount: payableAmount * 100,
        currency: 'INR',
        name: hostel.name,
        description: `Room ${selectedRoom.room_number} - ${selectedSharingOption.type}`,
        order_id: order.id,
        prefill: { name: user?.name, email: user?.email, contact: (user as any)?.phone || '' },
        handler: async (response: any) => {
          try {
            const verifyResponse = await razorpayService.verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking.id,
              bookingType: 'hostel',
            });
            if (verifyResponse.success) {
              toast({ title: "Payment Successful", description: "Your booking has been confirmed!" });
              navigate(`/hostel-confirmation/${booking.id}`);
            } else { throw new Error('Payment verification failed'); }
          } catch (err) {
            console.error('Payment verification error:', err);
            toast({ title: "Verification Failed", description: "Please contact support", variant: "destructive" });
          }
        },
      };
      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.open();
    } catch (error: any) {
      console.error('Error processing booking:', error);
      toast({ title: "Booking Failed", description: error.message || 'An error occurred', variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoBack = () => navigate(-1);

  /* ─── Derived data ─── */
  const hostelImages = hostel?.images?.length ? hostel.images : (hostel?.logo_image ? [hostel.logo_image] : []);
  const lowestPrice = rooms.reduce((min, room) => {
    const roomMin = room.hostel_sharing_options?.reduce(
      (m: number, o: any) => Math.min(m, o.price_monthly || Infinity), Infinity
    ) ?? Infinity;
    return Math.min(min, roomMin);
  }, Infinity);

  const stayTypeLabel = hostel?.stay_type === "long_term" ? "Long-term" : hostel?.stay_type === "short_term" ? "Short-term" : "Both";

  // Effective price for selected bed
  const selectedBedPrice = selectedBed
    ? (selectedBed.price_override ?? selectedBed.price ?? 0)
    : 0;
  const effectiveBasePrice = durationType === 'daily' ? Math.round(selectedBedPrice / 30) : durationType === 'weekly' ? Math.round(selectedBedPrice / 4) : selectedBedPrice;
  const discountedPrice = selectedStayPackage?.discount_percentage
    ? Math.round(effectiveBasePrice * (1 - selectedStayPackage.discount_percentage / 100))
    : effectiveBasePrice;
  const priceLabel = durationType === 'daily' ? '/day' : durationType === 'weekly' ? '/wk' : '/mo';

  /* ─── Price calculations (after discountedPrice is defined) ─── */
  const totalPrice = discountedPrice * durationCount;
  const calculateAdvanceAmount = () => {
    if (!hostel?.advance_booking_enabled) return null;
    if (hostel.advance_use_flat && hostel.advance_flat_amount) {
      return Math.min(hostel.advance_flat_amount, totalPrice);
    }
    return Math.round(totalPrice * (hostel.advance_percentage / 100));
  };
  const advanceAmount = calculateAdvanceAmount();
  const payableAmount = (useAdvancePayment && advanceAmount !== null) ? advanceAmount : totalPrice;

  /* ─── Render ─── */
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background pb-24">
        {loading ? (
          <HostelDetailSkeleton />
        ) : error || !hostel ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <p className="text-center text-destructive text-sm mb-4">{error || "Hostel not found"}</p>
            <Button onClick={handleGoBack} size="sm">Go Back</Button>
          </div>
        ) : (
          <>
            {/* ═══ Collapsible Hero + Details ═══ */}
            <div
              ref={heroRef}
              className="transition-all duration-500 ease-in-out overflow-hidden"
              style={{ maxHeight: showDetails ? "2000px" : "0px", opacity: showDetails ? 1 : 0 }}
            >
              {/* Hero Image Slider */}
              <div className="relative">
                <div className="w-full overflow-hidden bg-muted">
                  <CabinImageSlider images={hostelImages} autoPlay hideThumbnails />
                </div>
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Badge className={`absolute top-3 right-3 ${getGenderColor(hostel.gender)} border-0 text-xs shadow-lg`}>
                  {hostel.gender?.charAt(0).toUpperCase() + hostel.gender?.slice(1)}
                </Badge>
              </div>

              {/* Name, Rating & Location */}
              <div className="px-3 pt-2 pb-1">
                <h1 className="text-lg font-bold text-foreground leading-tight">{hostel.name}</h1>
                {hostel.average_rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-medium text-foreground">{hostel.average_rating.toFixed(1)}</span>
                    {hostel.review_count > 0 && (
                      <span className="text-xs text-muted-foreground">({hostel.review_count} reviews)</span>
                    )}
                  </div>
                )}
                {hostel.location && (
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground leading-relaxed">{hostel.location}</span>
                  </div>
                )}
              </div>

              {/* Info Chips */}
              <div className="px-3 pt-0.5 pb-0.5">
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {lowestPrice < Infinity && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold whitespace-nowrap shadow-sm border border-emerald-500/20">
                      <IndianRupee className="h-3.5 w-3.5" />
                      From {formatCurrency(lowestPrice)}/mo
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shadow-sm border ${getGenderChipColor(hostel.gender)}`}>
                    <Users className="h-3.5 w-3.5" />
                    {hostel.gender?.charAt(0).toUpperCase() + hostel.gender?.slice(1)}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400 text-xs font-semibold whitespace-nowrap shadow-sm border border-purple-500/20">
                    <Building className="h-3.5 w-3.5" />
                    {stayTypeLabel}
                  </div>
                  {hostel.security_deposit > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold whitespace-nowrap shadow-sm border border-amber-500/20">
                      <Shield className="h-3.5 w-3.5" />
                      Deposit {formatCurrency(hostel.security_deposit)}
                    </div>
                  )}
                  {rooms.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold whitespace-nowrap shadow-sm border border-blue-500/20">
                      <Bed className="h-3.5 w-3.5" />
                      {rooms.length} room{rooms.length > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Details & Amenities */}
              <div className="px-3 pt-1 pb-0.5">
                <div className="bg-muted/30 rounded-xl p-2.5 border border-border/50">
                  <h3 className="text-sm font-semibold text-foreground mb-2">Details & Amenities</h3>
                  {hostel.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">{hostel.description}</p>
                  )}
                  {hostel.description && hostel.amenities?.length > 0 && <Separator className="my-2.5 opacity-50" />}
                  {hostel.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {hostel.amenities.map((amenity: string) => (
                        <span key={amenity} className="inline-flex items-center gap-1 text-xs bg-primary/5 text-foreground border border-primary/10 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="h-3 w-3 text-primary" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Sticky header when hero collapsed ═══ */}
            {!showDetails && (
              <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-3 py-2 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handleGoBack} className="h-8 w-8 rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold text-foreground truncate">{hostel.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-xs text-primary"
                  onClick={() => { setShowDetails(true); heroRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                >
                  View Details
                </Button>
              </div>
            )}

            {/* ═══ 1: Select Sharing Type ═══ */}
            <Separator className="my-0" />
            <div className="px-3 pt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">1</div>
                <Label className="text-sm font-semibold text-foreground">Select Sharing Type</Label>
              </div>

              {/* Sharing type pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                <button
                  onClick={() => handleSharingFilterChange('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                    sharingFilter === 'all'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  All
                </button>
                {sharingTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => handleSharingFilterChange(type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      sharingFilter === type
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Category pills (only if categories exist) */}
              {categories.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                  <button
                    onClick={() => handleCategoryFilterChange('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      categoryFilter === 'all'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryFilterChange(cat.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                        categoryFilter === cat.name
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {cat.name}
                      {cat.price_adjustment > 0 && ` (+${formatCurrency(cat.price_adjustment)})`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ═══ 2: Stay Duration ═══ */}
            <Separator className="my-0" />
            <div className="px-3 pt-2">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">2</div>
                <Label className="text-sm font-semibold text-foreground">Stay Duration</Label>
              </div>

              {/* Duration type pills - filtered by allowed_durations */}
              <div className="flex gap-2 mb-3">
                {(['daily', 'weekly', 'monthly'] as DurationType[]).filter(type => allowedDurations.includes(type)).map(type => (
                  <button
                    key={type}
                    onClick={() => { setDurationType(type); setDurationCount(1); setSelectedStayPackage(null); setSelectedBed(null); }}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      durationType === type
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {type === 'daily' ? 'Daily' : type === 'weekly' ? 'Weekly' : 'Monthly'}
                  </button>
                ))}
              </div>

              {/* Check-in date picker */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-muted-foreground">Check-in:</span>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[200px] justify-start text-left font-normal text-sm",
                        !checkInDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(checkInDate, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={checkInDate}
                      onSelect={handleCheckInDateChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                        date > addDays(new Date(), maxAdvanceBookingDays)
                      }
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Duration count */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm text-muted-foreground">Duration:</span>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => { if (durationCount > 1) { setDurationCount(durationCount - 1); setSelectedBed(null); } }}
                    className="px-3 py-1.5 text-sm font-bold bg-muted/50 hover:bg-muted border-r"
                  >−</button>
                  <span className="px-4 py-1.5 text-sm font-semibold min-w-[3rem] text-center">{durationCount}</span>
                  <button
                    onClick={() => { setDurationCount(durationCount + 1); setSelectedBed(null); }}
                    className="px-3 py-1.5 text-sm font-bold bg-muted/50 hover:bg-muted border-l"
                  >+</button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {durationType === 'daily' ? (durationCount === 1 ? 'day' : 'days') : durationType === 'weekly' ? (durationCount === 1 ? 'week' : 'weeks') : (durationCount === 1 ? 'month' : 'months')}
                </span>
              </div>

              {/* Check-in / Check-out info */}
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border/50 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium text-foreground">{format(checkInDate, 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium text-foreground">{format(endDate, 'dd MMM yyyy')}</span>
                </div>
              </div>
            </div>

            {/* ═══ 3: Select Your Bed ═══ */}
            <Separator className="my-0" />
            <div className="px-3 pt-2" ref={bedMapRef}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">3</div>
                <Label className="text-sm font-semibold text-foreground">Select Your Bed</Label>
              </div>

              <HostelBedMap
                hostelId={hostel.id}
                selectedBedId={selectedBed?.id}
                onBedSelect={handleBedSelect}
                readOnly={false}
                sharingFilter={sharingFilter}
                categoryFilter={categoryFilter}
                startDate={format(checkInDate, 'yyyy-MM-dd')}
                endDate={format(endDate, 'yyyy-MM-dd')}
              />
            </div>

            {/* ═══ 4: Choose Package ═══ */}
            {selectedBed && (<>
              <Separator className="my-0" />
              <div className="px-3 pt-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">4</div>
                  <Label className="text-sm font-semibold text-foreground">Choose Package</Label>
                </div>
                <StayDurationPackages
                  hostelId={hostel.id}
                  monthlyPrice={selectedBedPrice}
                  selectedPackage={selectedStayPackage}
                  onSelectPackage={setSelectedStayPackage}
                  durationType={durationType}
                />
              </div>
            </>)}

            {/* ═══ 5: Review & Pay ═══ */}
            {selectedBed && selectedStayPackage && (<>
              <Separator className="my-0" />
              <div className="px-3 pt-2 pb-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">5</div>
                  <Label className="text-sm font-semibold text-foreground">Review & Pay</Label>
                </div>

                <div className="bg-muted/30 rounded-xl border border-border/50 divide-y divide-border/50">
                  {/* Booking Summary */}
                  <div className="p-3 space-y-1.5 text-xs">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Booking Summary</h4>
                    <div className="flex justify-between"><span className="text-muted-foreground">Hostel</span><span className="font-medium text-foreground">{hostel.name}</span></div>
                    {selectedRoom && <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span className="font-medium text-foreground">{selectedRoom.room_number} (Floor {selectedRoom.floor})</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Bed</span><span className="font-medium text-foreground">#{selectedBed.bed_number}</span></div>
                    {selectedBed.sharingType && <div className="flex justify-between"><span className="text-muted-foreground">Sharing</span><span className="font-medium text-foreground">{selectedBed.sharingType}</span></div>}
                    {selectedBed.category && <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-medium text-foreground">{selectedBed.category}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span className="font-medium text-foreground">{format(checkInDate, 'dd MMM yyyy')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span className="font-medium text-foreground">{format(endDate, 'dd MMM yyyy')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium text-foreground">{durationCount} {durationType === 'daily' ? (durationCount === 1 ? 'day' : 'days') : durationType === 'weekly' ? (durationCount === 1 ? 'week' : 'weeks') : (durationCount === 1 ? 'month' : 'months')}</span></div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="p-3 space-y-1.5 text-xs">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Price Breakdown</h4>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Price</span>
                      <span className="font-medium text-foreground">{formatCurrency(effectiveBasePrice)} {priceLabel} × {durationCount}</span>
                    </div>
                    {selectedStayPackage.discount_percentage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Package Discount ({selectedStayPackage.name})</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">-{selectedStayPackage.discount_percentage}%</span>
                      </div>
                    )}
                    <Separator className="my-1.5 opacity-50" />
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-foreground">Total Amount</span>
                      <span className="font-bold text-primary">{formatCurrency(totalPrice)}</span>
                    </div>
                    {hostel.security_deposit > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Security Deposit</span>
                        <span className="font-medium text-foreground">{formatCurrency(hostel.security_deposit)} <span className="text-muted-foreground">(at check-in)</span></span>
                      </div>
                    )}
                  </div>

                  {/* Advance Payment Option */}
                  {hostel.advance_booking_enabled && advanceApplicableDurations.includes(durationType) && advanceAmount !== null && advanceAmount < totalPrice && (
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="advance-payment"
                          checked={useAdvancePayment}
                          onCheckedChange={(checked) => setUseAdvancePayment(checked === true)}
                        />
                        <label htmlFor="advance-payment" className="text-xs font-medium text-foreground cursor-pointer leading-tight">
                          Book with advance payment
                        </label>
                      </div>
                      {useAdvancePayment && (
                        <div className="ml-6 space-y-1 text-xs bg-primary/5 rounded-lg p-2.5 border border-primary/10">
                          <div className="flex justify-between"><span className="text-muted-foreground">Pay now</span><span className="font-semibold text-primary">{formatCurrency(advanceAmount)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Remaining due</span><span className="font-medium text-foreground">{formatCurrency(totalPrice - advanceAmount)}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Due by</span><span className="font-medium text-foreground">{format(endDate, 'dd MMM yyyy')}</span></div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Terms & Conditions */}
                  <div className="p-3 space-y-2">
                    {hostel.refund_policy && (
                      <Collapsible open={rulesOpen} onOpenChange={setRulesOpen}>
                        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-primary font-medium w-full">
                          {rulesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          Hostel Rules & Refund Policy
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{hostel.refund_policy}</p>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                    <div className="flex items-start gap-2 pt-1">
                      <Checkbox
                        id="terms"
                        checked={agreedToTerms}
                        onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      />
                      <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer leading-tight">
                        I agree to the terms and conditions, cancellation policy, and hostel rules.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pay Button */}
                <Button
                  className="w-full mt-4"
                  size="lg"
                  disabled={!agreedToTerms || isProcessing}
                  onClick={handleProceedToPayment}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Processing...' : useAdvancePayment && advanceAmount ? `Pay ${formatCurrency(advanceAmount)} Advance` : `Confirm & Pay ${formatCurrency(totalPrice)}`}
                </Button>
              </div>
            </>)}
          </>
        )}

      </div>
    </ErrorBoundary>
  );
};

export default HostelRoomDetails;
