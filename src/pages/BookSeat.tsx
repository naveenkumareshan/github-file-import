import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cabinsService } from "@/api/cabinsService";
import { ArrowLeft, ChevronDown, ChevronUp, Users, IndianRupee, Layers, Armchair } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CabinImageSlider } from "@/components/CabinImageSlider";

const SeatBookingForm = lazy(() =>
  import("@/components/seats/SeatBookingForm").then((m) => ({
    default: m.SeatBookingForm,
  }))
);

export interface Seat {
  _id: string;
  id: string;
  number: number;
  cabinId: string;
  price: number;
  category?: string;
  position: {
    x: number;
    y: number;
  };
  isAvailable: boolean;
  isHotSelling: boolean;
  unavailableUntil?: string;
}

export interface Cabin {
  id: string;
  _id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  images: string[];
  imageUrl: string;
  imageSrc: string;
  category: "standard" | "premium" | "luxury";
  isActive?: boolean;
  isBookingActive?: boolean;
  serialNumber?: string;
  averageRating?: number;
  reviewCount?: number;
  floors?: { id: string; number: number }[];
  lockerPrice?: number;
}

export interface RoomElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
}

const BookSeat = () => {
  const { cabinId } = useParams<{ cabinId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const bookingFormRef = useRef<HTMLDivElement>(null);

  const [cabin, setCabin] = useState<Cabin | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomElements, setRoomElements] = useState<RoomElement[]>([]);
  const [hideSeats, setHideSeats] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const [roomWidth, setRoomWidth] = useState(800);
  const [roomHeight, setRoomHeight] = useState(600);

  useEffect(() => {
    if (cabinId) fetchCabinDetails();
  }, [cabinId]);

  const fetchCabinDetails = async () => {
    try {
      setLoading(true);
      if (!cabinId) { setError("Invalid cabin ID"); return; }

      const response = await cabinsService.getCabinById(cabinId);
      if (response.success && response.data) {
        const d = response.data;
        setCabin({
          _id: d.id,
          id: d.id,
          name: d.name,
          description: d.description || '',
          price: d.price || 0,
          amenities: d.amenities || [],
          capacity: d.capacity || 1,
          images: d.images?.length ? d.images : (d.image_url ? [d.image_url] : []),
          imageSrc: d.image_url || '',
          floors: Array.isArray(d.floors) ? (d.floors as any[]) : [],
          lockerPrice: (d as any).locker_available ? ((d as any).locker_price || 0) : 0,
          isBookingActive: (d as any).is_booking_active !== false,
          isActive: d.is_active !== false,
          category: (d.category as 'standard' | 'premium' | 'luxury') || 'standard',
          imageUrl: d.image_url || 'https://images.unsplash.com/photo-1626948683838-3be9a4e90737?q=80&w=1470&auto=format&fit=crop',
        });
        setLayoutImage((d as any).layout_image || null);
        setRoomWidth((d as any).room_width || 800);
        setRoomHeight((d as any).room_height || 600);
      } else {
        toast({ title: "Error", description: "Failed to load cabin details", variant: "destructive" });
      }
    } catch (err) {
      console.error("Error fetching cabin details:", err);
      setError("Failed to load cabin details");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeat(seat);
  };

  const handleGoBack = () => navigate("/cabins");

  const handleBookingComplete = (bookingId: string) => {
    toast({ title: "Booking Successful", description: "Your seat has been booked successfully!" });
    navigate("/book-confirmation/" + bookingId);
  };

  const hideSeatSelection = (_bookingId: string, status: boolean) => {
    if (!status) setSelectedSeat(null);
    setHideSeats(status);
  };

  const cabinImages = cabin ? (cabin.images?.length ? cabin.images : (cabin.imageSrc ? [cabin.imageSrc] : [cabin.imageUrl])) : [];

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'premium': return 'bg-purple-500/90 text-white';
      case 'luxury': return 'bg-amber-500/90 text-white';
      default: return 'bg-primary/90 text-primary-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-7 w-7 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-center text-destructive text-sm mb-4">{error}</p>
          <Button onClick={handleGoBack} size="sm">Go Back</Button>
        </div>
      ) : cabin && (
        <>
          {/* Hero Image Section */}
          <div className="relative">
            <div className="w-full aspect-[16/10] overflow-hidden bg-muted">
              <CabinImageSlider images={cabinImages} />
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
            {/* Back button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {/* Category badge */}
            <Badge className={`absolute top-3 right-3 ${getCategoryColor(cabin.category)} border-0 text-xs`}>
              {cabin.category.charAt(0).toUpperCase() + cabin.category.slice(1)}
            </Badge>
            {/* Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h1 className="text-white font-semibold text-lg leading-tight drop-shadow-lg">{cabin.name}</h1>
            </div>
          </div>

          {/* Info Chips */}
          <div className="px-3 pt-3">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-medium whitespace-nowrap">
                <IndianRupee className="h-3 w-3" />
                ₹{cabin.price}/mo
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-medium whitespace-nowrap">
                <Users className="h-3 w-3" />
                {cabin.capacity} seats
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-medium whitespace-nowrap">
                <Layers className="h-3 w-3" />
                {cabin.floors?.length || 1} floor{(cabin.floors?.length || 1) > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Collapsible Details */}
          <div className="px-3 pt-2">
            <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground">
                <span>Details & Amenities</span>
                {detailsOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-3">
                {cabin.description && (
                  <p className="text-xs text-muted-foreground mb-3">{cabin.description}</p>
                )}
                {cabin.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {cabin.amenities.map((amenity) => (
                      <span key={amenity} className="inline-flex items-center text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md">
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Booking Form */}
          <div className="px-3 pt-2" ref={bookingFormRef}>
            <Suspense fallback={<div className="p-3 text-sm text-muted-foreground">Loading booking form...</div>}>
              <SeatBookingForm
                cabin={cabin}
                selectedSeat={selectedSeat}
                onBookingComplete={handleBookingComplete}
                hideSeatSelection={hideSeatSelection}
                roomElements={roomElements}
                layoutImage={layoutImage}
                roomWidth={roomWidth}
                roomHeight={roomHeight}
              />
            </Suspense>
          </div>

          {/* Sticky Bottom Seat Info Card */}
          {selectedSeat && cabin.isBookingActive && (
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
              <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
                <Armchair className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">Seat #{selectedSeat.number}</span>
                    {selectedSeat.category && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {selectedSeat.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">₹{selectedSeat.price}/mo</p>
                </div>
                <Button
                  size="sm"
                  className="text-xs h-8 px-4"
                  onClick={() => bookingFormRef.current?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Book Now
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookSeat;
