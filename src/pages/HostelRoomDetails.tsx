import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { hostelService } from "@/api/hostelService";
import { hostelRoomService } from "@/api/hostelRoomService";
import { hostelBedCategoryService, HostelBedCategory } from "@/api/hostelBedCategoryService";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  ArrowLeft,
  Bed,
  Building,
  CheckCircle2,
  CreditCard,
  ImageIcon,
  IndianRupee,
  Info,
  MapPin,
  Phone,
  Shield,
  Star,
  Users,
} from "lucide-react";
import { CabinImageSlider } from "@/components/CabinImageSlider";
import { getImageUrl } from "@/lib/utils";
import { formatCurrency } from "@/utils/currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HostelBedMap } from "@/components/hostels/HostelBedMap";
import { StayDurationPackages } from "@/components/hostels/StayDurationPackages";
import { StayPackage } from "@/api/hostelStayPackageService";

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
  const { toast } = useToast();
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
  const [showDetails, setShowDetails] = useState(true);
  const [categories, setCategories] = useState<HostelBedCategory[]>([]);

  // Image gallery
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  /* ─── Data fetch ─── */
  useEffect(() => {
    const fetchData = async () => {
      if (!hostelId || fetchedRef.current) return;
      try {
        fetchedRef.current = true;
        setLoading(true);
        setError(null);
        const [hostelData, roomsData, catResult] = await Promise.all([
          hostelService.getHostelById(hostelId),
          hostelRoomService.getHostelRooms(hostelId),
          hostelBedCategoryService.getCategories(hostelId),
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

  /* ─── Handlers ─── */
  const handleBedSelect = (bed: any) => {
    setSelectedBed(bed);
    // Scroll to packages section smoothly
    setTimeout(() => {
      bedMapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  const handleBookNow = () => {
    if (!selectedBed || !hostel) return;
    
    // Find the room and sharing option for the selected bed
    const room = rooms.find(r => 
      r.hostel_sharing_options?.some((opt: any) => opt.id === selectedBed.sharing_option_id)
    );
    const sharingOption = room?.hostel_sharing_options?.find((opt: any) => opt.id === selectedBed.sharing_option_id);

    if (!room || !sharingOption) {
      toast({ title: "Error", description: "Could not find room details for selected bed", variant: "destructive" });
      return;
    }

    navigate(`/hostel-booking/${hostel.id}/${room.id}`, {
      state: { 
        room, 
        hostel, 
        sharingOption, 
        stayPackage: selectedStayPackage,
        selectedBed: {
          id: selectedBed.id,
          bed_number: selectedBed.bed_number,
          price: selectedBed.price_override ?? selectedBed.price ?? sharingOption.price_monthly,
          category: selectedBed.category,
          sharingType: selectedBed.sharingType,
        }
      },
    });
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
  const discountedPrice = selectedStayPackage?.discount_percentage
    ? Math.round(selectedBedPrice * (1 - selectedStayPackage.discount_percentage / 100))
    : selectedBedPrice;

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
                  {(hostel.contact_phone || hostel.contact_email) && (
                    <>
                      <Separator className="my-2.5 opacity-50" />
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {hostel.contact_phone && (
                          <a href={`tel:${hostel.contact_phone}`} className="flex items-center gap-1 text-primary font-medium">
                            <Phone className="h-3 w-3" /> {hostel.contact_phone}
                          </a>
                        )}
                        {hostel.contact_email && <span>{hostel.contact_email}</span>}
                      </div>
                    </>
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

            {/* ═══ Step 1: Filter Pills ═══ */}
            <div className="px-3 pt-3">
              <div className="mb-2">
                <h2 className="text-base font-bold text-foreground">Step 1: Select Sharing Type</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Filter beds by sharing type and category</p>
              </div>

              {/* Sharing type pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                <button
                  onClick={() => setSharingFilter('all')}
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
                    onClick={() => setSharingFilter(type)}
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
                    onClick={() => setCategoryFilter('all')}
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
                      onClick={() => setCategoryFilter(cat.name)}
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

            {/* ═══ Step 2: Select Your Bed (Inline Bed Map) ═══ */}
            <div className="px-3 pt-3" ref={bedMapRef}>
              <div className="mb-2">
                <h2 className="text-base font-bold text-foreground">Step 2: Select Your Bed</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedBed 
                    ? `Bed #${selectedBed.bed_number} selected (${selectedBed.sharingType || 'Unknown'})`
                    : 'Tap on an available bed to select it'}
                </p>
              </div>

              <HostelBedMap
                hostelId={hostel.id}
                selectedBedId={selectedBed?.id}
                onBedSelect={handleBedSelect}
                readOnly={false}
                sharingFilter={sharingFilter}
                categoryFilter={categoryFilter}
              />
            </div>

            {/* ═══ Step 3: Stay Duration (shown after bed selected) ═══ */}
            {selectedBed && (
              <div className="px-3 pt-4">
                <div className="mb-2">
                  <h2 className="text-base font-bold text-foreground">Step 3: Choose Stay Duration</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Select a stay package for better pricing</p>
                </div>
                <StayDurationPackages
                  hostelId={hostel.id}
                  monthlyPrice={selectedBedPrice}
                  selectedPackage={selectedStayPackage}
                  onSelectPackage={setSelectedStayPackage}
                />
              </div>
            )}

            {/* ═══ Sticky Bottom Bar ═══ */}
            {selectedBed && (
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 safe-area-bottom">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-semibold text-foreground truncate">
                        Bed #{selectedBed.bed_number}
                      </span>
                      {selectedBed.sharingType && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                          {selectedBed.sharingType}
                        </Badge>
                      )}
                      {selectedBed.category && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                          {selectedBed.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-bold text-primary">{formatCurrency(discountedPrice)}</span>
                      <span className="text-xs text-muted-foreground">/mo</span>
                      {selectedStayPackage && selectedStayPackage.discount_percentage > 0 && (
                        <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(selectedBedPrice)}</span>
                      )}
                    </div>
                  </div>
                  <Button onClick={handleBookNow} className="flex-shrink-0">
                    <CreditCard className="h-4 w-4 mr-1.5" />
                    Book Now
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ Image Gallery Dialog ═══ */}
        <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Room {selectedRoom?.room_number}</DialogTitle>
            </DialogHeader>
            {selectedRoom && (
              <div className="space-y-4">
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  {selectedImage ? (
                    <img src={getImageUrl(selectedImage)} alt={`Room ${selectedRoom.room_number}`} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {selectedRoom.images && selectedRoom.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {selectedRoom.images.map((img: string, index: number) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(img)}
                        className={`aspect-square rounded-md overflow-hidden cursor-pointer ${selectedImage === img ? "ring-2 ring-primary" : ""}`}
                      >
                        <img src={getImageUrl(img)} alt={`Room image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  );
};

export default HostelRoomDetails;
