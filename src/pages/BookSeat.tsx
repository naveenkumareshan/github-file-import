import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cabinsService } from "@/api/cabinsService";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
const SeatBookingForm = lazy(() =>
  import("@/components/seats/SeatBookingForm").then((m) => ({
    default: m.SeatBookingForm,
  }))
);

const CabinDetails = lazy(() =>
  import("@/components/CabinDetails").then((m) => ({
    default: m.CabinDetails,
  }))
);

export interface Seat {
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
  const cabinRef = useRef();
  const seatSelectionRef = useRef();

  const [cabin, setCabin] = useState<Cabin | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomElements, setRoomElements] = useState<RoomElement[]>([]);
  const [hideSeats, setHideSeats] = useState(false);
  useEffect(() => {
    if (cabinId) {
      fetchCabinDetails();
    }
  }, [cabinId]);

  const fetchCabinDetails = async () => {
    try {
      setLoading(true);

      if (!cabinId) {
        setError("Invalid cabin ID");
        return;
      }

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
          images: d.image_url ? [d.image_url] : [],
          imageSrc: d.image_url || '',
          floors: Array.isArray(d.floors) ? (d.floors as any[]) : [],
          lockerPrice: 500,
          isBookingActive: d.is_active,
          category: (d.category as 'standard' | 'premium' | 'luxury') || 'standard',
          imageUrl: d.image_url || 'https://images.unsplash.com/photo-1626948683838-3be9a4e90737?q=80&w=1470&auto=format&fit=crop',
        });
      } else {
        console.error("Error in cabin response:", response);
        toast({
          title: "Error",
          description: "Failed to load cabin details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching cabin details:", error);
      setError("Failed to load cabin details");
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: Seat) => {
    setSelectedSeat(seat);
    if (cabinRef) {
      scrollPage(cabinRef);
    }
  };

  const scrollPage = (sectionRef) => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGoBack = () => {
    navigate("/cabins");
  };

  const handleBookingComplete = (bookingId: string) => {
    toast({
      title: "Booking Successful",
      description: "Your seat has been booked successfully!",
    });
    navigate("/book-confirmation/" + bookingId);
  };

  const hideSeatSelection = (bookingId: string, status: boolean) => {
    if (!status) {
      setSelectedSeat(null);
      scrollPage(seatSelectionRef);
    }
    setHideSeats(status);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-3 py-3 max-w-lg mx-auto">
        {/* Compact header */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            className="h-8 w-8 rounded-xl flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-[16px] font-semibold leading-tight">Book Reading Room</h1>
            {cabin && (
              <p className="text-[11px] text-muted-foreground truncate">
                {cabin.name} · {cabin.category}
              </p>
            )}
          </div>
        </div>

        <Separator className="mb-3" />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-7 w-7 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-center text-destructive text-[13px] mb-4">{error}</p>
              <Button onClick={handleGoBack} size="sm">Go Back</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {cabin && (
              <Suspense fallback={<div className="p-3 text-[13px] text-muted-foreground">Loading cabin details...</div>}>
                <CabinDetails cabin={cabin} />
              </Suspense>
            )}
            {cabin && (
              <div ref={cabinRef}>
                <Suspense fallback={<div className="p-3 text-[13px] text-muted-foreground">Loading booking form...</div>}>
                  <SeatBookingForm
                    cabin={cabin}
                    selectedSeat={selectedSeat}
                    onBookingComplete={handleBookingComplete}
                    hideSeatSelection={hideSeatSelection}
                    roomElements={roomElements}
                  />
                </Suspense>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSeat;
