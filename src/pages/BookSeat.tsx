import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "../components/Navigation";
import { Footer } from "../components/Footer";
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
        setCabin({
          _id: response.data._id || response.data.id,
          id: response.data._id || response.data.id,
          name: response.data.name,
          description: response.data.description,
          price: response.data.price,
          amenities: response.data.amenities || [],
          capacity: response.data.capacity || 1,
          // images: response.data.images.legth > 0 ? response.data.images.legth  : [response.data.imageSrc],
          images: response.data.images || [response.data.imageSrc],
          imageSrc: response.data.imageSrc,
          floors : response.data.floors,
          lockerPrice: response.data.lockerPrice,
          isBookingActive: response.data.isBookingActive,
          category: response.data.category || "standard",
          imageUrl:
            response.data.imageUrl ||
            "https://images.unsplash.com/photo-1626948683838-3be9a4e90737?q=80&w=1470&auto=format&fit=crop",
        });

        // Save room elements if available
        if (
          response.data.roomElements &&
          Array.isArray(response.data.roomElements)
        ) {
          setRoomElements(response.data.roomElements);
        }
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
    <div className="min-h-screen bg-accent/30">
      <Navigation />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Book Your Reading Room</h1>
            {cabin && (
              <p className="text-muted-foreground">
                {cabin.name} - {cabin.category} room
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleGoBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Separator className="my-4" />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-cabin-wood border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-center text-red-500 mb-4">{error}</p>
              <Button onClick={handleGoBack}>Go Back</Button>
            </CardContent>
          </Card>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {cabin && (
              <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading cabin details...</div>}>
                <CabinDetails cabin={cabin} />
              </Suspense>
            )}
            {cabin && (
            <div ref={cabinRef} className="md:sticky md:top-24">
              <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading booking form...</div>}>
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
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BookSeat;
