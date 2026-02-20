import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { hostelService } from "@/api/hostelService";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Bed,
  Building,
  CreditCard,
  Calendar,
  Info,
  CheckCircle,
  Hotel,
  ImageIcon,
} from "lucide-react";
import { CabinImageSlider } from "@/components/CabinImageSlider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const HostelRoomDetails = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [room, setRoom] = useState<any>(null);
  const [hostel, setHostel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSharingOption, setSelectedSharingOption] = useState<any>(null);
  const fetchedRef = useRef(false);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!roomId || fetchedRef.current) return;

      try {
        fetchedRef.current = true;
        setLoading(true);
        setError(null);

        const roomResponse = await hostelService.getHostelById(roomId);
        if (roomResponse.success) {
          setRoom(roomResponse.data);
          setHostel(roomResponse.data);
        } else {
          setError("Failed to load room details");
        }
      } catch (error) {
        console.error("Error fetching room details:", error);
        setError("Failed to load room details");
        toast({
          title: "Error",
          description: "Failed to load room details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId]);

  const handleSelectSharingOption = (option: any) => {
    setSelectedSharingOption(option);
  };

  const handleBookNow = (room) => {
    if (!selectedSharingOption) {
      toast({
        title: "Selection Required",
        description: "Please select a sharing option first",
        variant: "default",
      });
      return;
    }

    // Navigate to booking page with room and sharing option details
    navigate(`/hostel-booking/${room.hostelId}/${room._id}`, {
      state: {
        room,
        hostel,
        sharingOption: selectedSharingOption,
      },
    });
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "luxury":
        return <Badge className="bg-purple-500">Luxury</Badge>;
      case "premium":
        return <Badge className="bg-blue-500">Premium</Badge>;
      default:
        return <Badge className="bg-green-500">Standard</Badge>;
    }
  };

  const handleOpenImageGallery = (room: any, initialImage?: string) => {
    console.log(room);
    setSelectedRoom(room);
    setSelectedImage(initialImage || room.imageSrc);
    setIsImageGalleryOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-grow container mx-auto p-6 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-grow container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">{error || "Room not found"}</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => navigate(-1)}>Go Back</Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Navigation />

        <div className="flex-grow container mx-auto p-6">
          <div className="flex flex-col gap-6">
            {/* Breadcrumb navigation */}
            <div className="flex items-center text-sm text-muted-foreground">
              <button
                onClick={() => navigate("/hostels")}
                className="hover:text-primary"
              >
                Hostels
              </button>
              <span className="mx-2">/</span>
              {hostel && (
                <>
                  <button
                    onClick={() => navigate(`/hostels/${hostel._id}`)}
                    className="hover:text-primary"
                  >
                    {hostel.name}
                  </button>
                  <span className="mx-2">/</span>
                </>
              )}
              <span className="text-primary">{room.name}</span>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Room details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  {/* Hostel images slider if available */}
                  {hostel.images && hostel.images.length > 0 && (
                    <div className="mb-6">
                      <CabinImageSlider images={hostel.images} />
                    </div>
                  )}
                </Card>

                {hostel && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl">
                        About the Hostel
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        {hostel.logoImage ? (
                          <img
                            src={
                              import.meta.env.VITE_BASE_URL + hostel.logoImage
                            }
                            alt={hostel.name}
                            className="h-16 w-16 object-cover rounded-md"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                            <Building className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-medium">{hostel.name}</h3>
                          <p className="text-muted-foreground">
                            {hostel.location}
                          </p>
                        </div>
                      </div>

                      {hostel.description && (
                        <div>
                          <p className="text-muted-foreground">
                            {hostel.description}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {hostel.contactEmail && (
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">
                              Contact Email
                            </span>
                            <span className="font-medium">
                              {hostel.contactEmail}
                            </span>
                          </div>
                        )}
                        {hostel.contactPhone && (
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">
                              Contact Phone
                            </span>
                            <span className="font-medium">
                              {hostel.contactPhone}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right column - Booking panel */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-xl">Book This Room</CardTitle>
                    <CardDescription>
                      Select your preferred sharing option
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hostel.rooms?.map((room, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 cursor-pointer transition-colors"
                      >
                      <div>
  {/* Room Details Header */}
  <h3 className="text-lg font-medium mb-3">Room Details</h3>

  <div className="flex gap-6 items-start">
    {/* Image + count */}
    <div
      className="relative h-40 w-40 rounded overflow-hidden cursor-pointer"
      onClick={() => handleOpenImageGallery(room)}
    >
      {room.imageSrc ? (
        <img
          src={import.meta.env.VITE_BASE_URL + room.imageSrc}
          alt={room.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-muted flex items-center justify-center">
          <Bed className="h-6 w-6 text-muted-foreground" />
        </div>
      )}

      {/* Show image count overlay */}
      {room.images && room.images.length > 1 && (
        <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <ImageIcon className="h-3 w-3" />
          {room.images.length}
        </div>
      )}
    </div>

    {/* Room details */}
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 flex-1">
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Room Number</span>
        <span className="font-medium">{room.roomNumber}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Floor</span>
        <span className="font-medium">{room.floor}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-muted-foreground">Category</span>
        <span className="font-medium">
          {room.category?.charAt(0).toUpperCase() + room.category?.slice(1)}
        </span>
      </div>
    </div>
  </div>

  {/* Separator full width */}
  <div className="mt-4">
    <Separator />
  </div>
</div>

                        <div>
                        {room.amenities && room.amenities.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h3 className="text-lg font-medium mb-3">
                                Amenities
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {room.amenities.map(
                                  (amenity: string, index: number) => (
                                    <Badge key={index} variant="secondary">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {amenity}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          </>
                        )}
                        </div>
                        <div>
                        <br></br>
                        {room.sharingOptions &&
                        room.sharingOptions.length > 0 ? (
                          <div className="space-y-4">
                            {room.sharingOptions.map(
                              (option: any, optionIndex: number) => (
                                <div
                                  key={optionIndex}
                                  onClick={() =>
                                    handleSelectSharingOption(option)
                                  }
                                  className={`relative border rounded-xl p-4 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                                    selectedSharingOption === option
                                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                      : "hover:border-primary/50"
                                  }`}
                                >
                                  {/* Header */}
                                  <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-base font-semibold">
                                      {option.type}
                                    </h4>
                                    <Badge
                                      variant={
                                        option.available > 0
                                          ? "default"
                                          : "outline"
                                      }
                                      className={`${
                                        option.available > 0
                                          ? "bg-green-500 text-white"
                                          : "border text-muted-foreground"
                                      }`}
                                    >
                                      {option.available > 0
                                        ? "Available"
                                        : "Full"}
                                    </Badge>
                                  </div>

                                  {/* Capacity */}
                                  <div className="text-sm text-muted-foreground">
                                    {option.capacity} persons per unit
                                  </div>

                                  {/* Availability Bar */}
                                  <div className="mt-3">
                                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                      <span>Available: {option.available}</span>
                                      <span>
                                        Total: {option.count * option.capacity}
                                      </span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className={`h-2 rounded-full ${
                                          option.available > 0
                                            ? "bg-green-500"
                                            : "bg-gray-400"
                                        }`}
                                        style={{
                                          width: `${
                                            (option.available /
                                              (option.count *
                                                option.capacity)) *
                                            100
                                          }%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div className="mt-4">
                                    <span className="text-lg font-bold text-foreground">
                                      ₹{option.price}
                                    </span>
                                    <span className="ml-1 text-sm text-muted-foreground">
                                      per day
                                    </span>
                                  </div>
                                </div>
                              )
                            )}

                            <Button
                              className="w-full"
                              disabled={
                                !selectedSharingOption ||
                                selectedSharingOption?.available <= 0
                              }
                              onClick={() => handleBookNow(room)}
                            >
                              <CreditCard className="mr-2 h-5 w-5" />
                              Book Now
                            </Button>

                            {!selectedSharingOption ? (
                              <p className="text-sm text-center text-muted-foreground">
                                Please select a sharing option above
                              </p>
                            ) : selectedSharingOption.available <= 0 ? (
                              <p className="text-sm text-center text-muted-foreground">
                                This option is currently full
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">
                              No sharing options available for this room
                            </p>
                          </div>
                        )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery Dialog */}
        <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Room Number : {selectedRoom?.roomNumber}
              </DialogTitle>
            </DialogHeader>
            {selectedRoom && (
              <div className="space-y-6">
                {/* Main Selected Image */}
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  {selectedImage ? (
                    <img
                      src={import.meta.env.VITE_BASE_URL + selectedImage}
                      alt={selectedRoom.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bed className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {selectedRoom.images && selectedRoom.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {selectedRoom.images.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(img)}
                        className={`aspect-square rounded-md overflow-hidden cursor-pointer ${
                          selectedImage === img ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <img
                          src={import.meta.env.VITE_BASE_URL + img}
                          alt={`Room image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default HostelRoomDetails;
