import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { hostelService } from "@/api/hostelService";
import { hostelRoomService } from "@/api/hostelRoomService";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  Bed,
  Building,
  CreditCard,
  Info,
  CheckCircle,
  ImageIcon,
  MapPin,
  Phone,
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

const HostelRoomDetails = () => {
  const { roomId: hostelId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<any[]>([]);
  const [hostel, setHostel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSharingOption, setSelectedSharingOption] = useState<any>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [isBedMapOpen, setIsBedMapOpen] = useState(false);
  const [selectedStayPackage, setSelectedStayPackage] = useState<StayPackage | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!hostelId || fetchedRef.current) return;

      try {
        fetchedRef.current = true;
        setLoading(true);
        setError(null);

        const [hostelData, roomsData] = await Promise.all([
          hostelService.getHostelById(hostelId),
          hostelRoomService.getHostelRooms(hostelId),
        ]);

        setHostel(hostelData);
        setRooms(roomsData || []);
      } catch (error) {
        console.error("Error fetching hostel details:", error);
        setError("Failed to load hostel details");
        toast({
          title: "Error",
          description: "Failed to load hostel details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hostelId]);

  const handleSelectSharingOption = (option: any, roomId: string) => {
    setSelectedSharingOption(option);
    setSelectedRoomId(roomId);
  };

  const getAvailableCount = (option: any) => {
    return option.hostel_beds?.filter((b: any) => b.is_available && !b.is_blocked).length || 0;
  };

  const getTotalBedCount = (option: any) => {
    return option.total_beds || 0;
  };

  const handleBookNow = (room: any) => {
    if (!selectedSharingOption || selectedRoomId !== room.id) {
      toast({
        title: "Selection Required",
        description: "Please select a sharing option first",
        variant: "default",
      });
      return;
    }

    navigate(`/hostel-booking/${hostel.id}/${room.id}`, {
      state: {
        room,
        hostel,
        sharingOption: selectedSharingOption,
        stayPackage: selectedStayPackage,
      },
    });
  };

  const handleOpenImageGallery = (room: any, initialImage?: string) => {
    setSelectedRoom(room);
    setSelectedImage(initialImage || room.image_url);
    setIsImageGalleryOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-7 w-7 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !hostel) {
    return (
      <div className="px-3 py-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-[15px]">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive text-[13px]">{error || "Hostel not found"}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate(-1)} size="sm">Go Back</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow px-3 py-3 max-w-lg mx-auto w-full">
          <div className="flex flex-col gap-6">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-muted-foreground">
              <button onClick={() => navigate("/hostels")} className="hover:text-primary">
                Hostels
              </button>
              <span className="mx-2">/</span>
              <span className="text-primary">{hostel.name}</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Hostel images */}
              <Card>
                {hostel.images && hostel.images.length > 0 && (
                  <div className="mb-3">
                    <CabinImageSlider images={hostel.images} />
                  </div>
                )}
              </Card>

              {/* Hostel info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[14px] font-semibold">
                    About the Hostel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="flex items-center gap-4">
                    {hostel.logo_image ? (
                      <img
                        src={getImageUrl(hostel.logo_image)}
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
                      <p className="text-muted-foreground">{hostel.location}</p>
                    </div>
                  </div>

                  {hostel.description && (
                    <p className="text-muted-foreground">{hostel.description}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hostel.contact_email && (
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Contact Email</span>
                        <span className="font-medium">{hostel.contact_email}</span>
                      </div>
                    )}
                    {hostel.contact_phone && (
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Contact Phone</span>
                        <span className="font-medium">{hostel.contact_phone}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rooms & Booking */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle className="text-xl">Rooms & Pricing</CardTitle>
                    <CardDescription>Select your preferred sharing option</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {rooms.length === 0 ? (
                      <div className="text-center py-6">
                        <Info className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No rooms available</p>
                      </div>
                    ) : (
                      rooms.map((room) => (
                        <div key={room.id} className="border rounded-lg p-4 cursor-pointer transition-colors">
                          {/* Room Details Header */}
                          <h3 className="text-[13px] font-semibold mb-2">Room Details</h3>
                          <div className="flex gap-6 items-start">
                            <div
                              className="relative h-40 w-40 rounded overflow-hidden cursor-pointer"
                              onClick={() => handleOpenImageGallery(room)}
                            >
                              {room.image_url ? (
                                <img src={getImageUrl(room.image_url)} alt={`Room ${room.room_number}`} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full bg-muted flex items-center justify-center">
                                  <Bed className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              {room.images && room.images.length > 1 && (
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  {room.images.length}
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 flex-1">
                              <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Room Number</span>
                                <span className="font-medium">{room.room_number}</span>
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

                          <div className="mt-4"><Separator /></div>

                          {/* Amenities */}
                          {room.amenities && room.amenities.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h3 className="text-lg font-medium mb-3">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                  {room.amenities.map((amenity: string, index: number) => (
                                    <Badge key={index} variant="secondary">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {amenity}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Sharing Options */}
                          <div>
                            <br />
                            {room.hostel_sharing_options && room.hostel_sharing_options.length > 0 ? (
                              <div className="space-y-4">
                                {room.hostel_sharing_options.map((option: any, optionIndex: number) => {
                                  const available = getAvailableCount(option);
                                  const totalBeds = getTotalBedCount(option);

                                  return (
                                    <div
                                      key={optionIndex}
                                      onClick={() => handleSelectSharingOption(option, room.id)}
                                      className={`relative border rounded-xl p-4 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                                        selectedSharingOption?.id === option.id && selectedRoomId === room.id
                                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                          : "hover:border-primary/50"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-base font-semibold">{option.type}</h4>
                                        <Badge
                                          variant={available > 0 ? "default" : "outline"}
                                          className={`${
                                            available > 0
                                              ? "bg-green-500 text-white"
                                              : "border text-muted-foreground"
                                          }`}
                                        >
                                          {available > 0 ? "Available" : "Full"}
                                        </Badge>
                                      </div>

                                      <div className="text-sm text-muted-foreground">
                                        {option.capacity} persons per unit
                                      </div>

                                      <div className="mt-3">
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                          <span>Available: {available}</span>
                                          <span>Total: {totalBeds}</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                          <div
                                            className={`h-2 rounded-full ${
                                              available > 0 ? "bg-green-500" : "bg-gray-400"
                                            }`}
                                            style={{
                                              width: `${totalBeds > 0 ? (available / totalBeds) * 100 : 0}%`,
                                            }}
                                          />
                                        </div>
                                      </div>

                                      <div className="mt-4">
                                        <span className="text-lg font-bold text-foreground">
                                          {formatCurrency(option.price_monthly)}
                                        </span>
                                        <span className="ml-1 text-sm text-muted-foreground">
                                          per month
                                        </span>
                                        {option.price_daily > 0 && (
                                          <span className="ml-2 text-sm text-muted-foreground">
                                            ({formatCurrency(option.price_daily)}/day)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}

                                {/* Stay Duration Packages */}
                                {selectedSharingOption && selectedRoomId === room.id && (
                                  <div className="mt-4">
                                    <Separator className="mb-4" />
                                    <StayDurationPackages
                                      hostelId={hostel.id}
                                      monthlyPrice={selectedSharingOption.price_monthly}
                                      selectedPackage={selectedStayPackage}
                                      onSelectPackage={setSelectedStayPackage}
                                    />
                                  </div>
                                )}

                                {/* View Bed Map */}
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => setIsBedMapOpen(true)}
                                >
                                  <MapPin className="mr-2 h-4 w-4" />
                                  View Bed Map
                                </Button>

                                <Button
                                  className="w-full"
                                  disabled={
                                    !selectedSharingOption ||
                                    selectedRoomId !== room.id ||
                                    getAvailableCount(selectedSharingOption) <= 0
                                  }
                                  onClick={() => handleBookNow(room)}
                                >
                                  <CreditCard className="mr-2 h-5 w-5" />
                                  Book Now
                                </Button>

                                {(!selectedSharingOption || selectedRoomId !== room.id) ? (
                                  <p className="text-sm text-center text-muted-foreground">
                                    Please select a sharing option above
                                  </p>
                                ) : getAvailableCount(selectedSharingOption) <= 0 ? (
                                  <p className="text-sm text-center text-muted-foreground">
                                    This option is currently full
                                  </p>
                                ) : null}

                                {/* Contact for short stays */}
                                {hostel.contact_phone && (
                                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">
                                      To book for less than 30 days, contact{' '}
                                      <a href={`tel:${hostel.contact_phone}`} className="text-primary font-medium">
                                        <Phone className="h-3 w-3 inline mr-0.5" />
                                        {hostel.contact_phone}
                                      </a>
                                    </p>
                                  </div>
                                )}
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
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Bed Map Dialog */}
        <Dialog open={isBedMapOpen} onOpenChange={setIsBedMapOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bed Map - {hostel.name}</DialogTitle>
            </DialogHeader>
            <HostelBedMap hostelId={hostel.id} readOnly />
          </DialogContent>
        </Dialog>

        {/* Image Gallery Dialog */}
        <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Room Number : {selectedRoom?.room_number}
              </DialogTitle>
            </DialogHeader>
            {selectedRoom && (
              <div className="space-y-6">
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  {selectedImage ? (
                    <img
                      src={getImageUrl(selectedImage)}
                      alt={`Room ${selectedRoom.room_number}`}
                      className="w-full h-full object-contain"
                    />
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
                        className={`aspect-square rounded-md overflow-hidden cursor-pointer ${
                          selectedImage === img ? "ring-2 ring-primary" : ""
                        }`}
                      >
                        <img
                          src={getImageUrl(img)}
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
      </div>
    </ErrorBoundary>
  );
};

export default HostelRoomDetails;
