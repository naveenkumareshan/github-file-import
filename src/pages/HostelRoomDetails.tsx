import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { hostelService } from "@/api/hostelService";
import { hostelRoomService } from "@/api/hostelRoomService";
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
  const roomsSectionRef = useRef<HTMLDivElement>(null);

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
  const [showDetails, setShowDetails] = useState(true);

  /* ─── Data fetch ─── */
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

  /* ─── Collapse hero when a sharing option is selected ─── */
  useEffect(() => {
    if (selectedSharingOption) setShowDetails(false);
  }, [selectedSharingOption]);

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

  /* ─── Handlers (unchanged logic) ─── */
  const handleSelectSharingOption = (option: any, roomId: string) => {
    setSelectedSharingOption(option);
    setSelectedRoomId(roomId);
  };

  const getAvailableCount = (option: any) =>
    option.hostel_beds?.filter((b: any) => b.is_available && !b.is_blocked).length || 0;

  const getTotalBedCount = (option: any) => option.total_beds || 0;

  const handleBookNow = (room: any) => {
    if (!selectedSharingOption || selectedRoomId !== room.id) {
      toast({ title: "Selection Required", description: "Please select a sharing option first", variant: "default" });
      return;
    }
    navigate(`/hostel-booking/${hostel.id}/${room.id}`, {
      state: { room, hostel, sharingOption: selectedSharingOption, stayPackage: selectedStayPackage },
    });
  };

  const handleOpenImageGallery = (room: any, initialImage?: string) => {
    setSelectedRoom(room);
    setSelectedImage(initialImage || room.image_url);
    setIsImageGalleryOpen(true);
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
                {/* Gradient for button visibility */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                {/* Back button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  className="absolute top-3 left-3 h-9 w-9 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border border-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {/* Gender badge */}
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
                  {hostel.description && hostel.amenities?.length > 0 && (
                    <Separator className="my-2.5 opacity-50" />
                  )}
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

                  {/* Contact info */}
                  {(hostel.contact_phone || hostel.contact_email) && (
                    <>
                      <Separator className="my-2.5 opacity-50" />
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {hostel.contact_phone && (
                          <a href={`tel:${hostel.contact_phone}`} className="flex items-center gap-1 text-primary font-medium">
                            <Phone className="h-3 w-3" /> {hostel.contact_phone}
                          </a>
                        )}
                        {hostel.contact_email && (
                          <span>{hostel.contact_email}</span>
                        )}
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

            {/* ═══ Rooms & Pricing ═══ */}
            <div className="px-3 pt-3" ref={roomsSectionRef}>
              <div className="mb-3">
                <h2 className="text-base font-bold text-foreground">Rooms & Pricing</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select your preferred room and sharing option</p>
              </div>

              {rooms.length === 0 ? (
                <div className="text-center py-10">
                  <Info className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No rooms available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div key={room.id} className="border border-border/60 rounded-xl overflow-hidden">
                      {/* Room header */}
                      <div className="flex gap-3 p-3">
                        <div
                          className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer bg-muted"
                          onClick={() => handleOpenImageGallery(room)}
                        >
                          {room.image_url ? (
                            <img src={getImageUrl(room.image_url)} alt={`Room ${room.room_number}`} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Bed className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          {room.images && room.images.length > 1 && (
                            <div className="absolute bottom-0.5 right-0.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <ImageIcon className="h-2.5 w-2.5" />
                              {room.images.length}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">Room {room.room_number}</h3>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              {room.category?.charAt(0).toUpperCase() + room.category?.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Floor {room.floor}</p>
                          {/* Room amenities */}
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {room.amenities.slice(0, 4).map((amenity: string, i: number) => (
                                <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                  {amenity}
                                </span>
                              ))}
                              {room.amenities.length > 4 && (
                                <span className="text-[10px] text-muted-foreground">+{room.amenities.length - 4}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <Separator />

                      {/* Sharing options */}
                      <div className="p-3 space-y-3">
                        {room.hostel_sharing_options && room.hostel_sharing_options.length > 0 ? (
                          <>
                            {room.hostel_sharing_options.map((option: any, idx: number) => {
                              const available = getAvailableCount(option);
                              const totalBeds = getTotalBedCount(option);
                              const isSelected = selectedSharingOption?.id === option.id && selectedRoomId === room.id;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => handleSelectSharingOption(option, room.id)}
                                  className={`relative border rounded-xl p-3 cursor-pointer transition-all ${
                                    isSelected
                                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                      : "hover:border-primary/50"
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1.5">
                                    <h4 className="text-sm font-semibold">{option.type}</h4>
                                    <Badge
                                      variant={available > 0 ? "default" : "outline"}
                                      className={`text-[10px] ${available > 0 ? "bg-green-500 text-white" : "border text-muted-foreground"}`}
                                    >
                                      {available > 0 ? `${available} Available` : "Full"}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground">{option.capacity} persons per unit</div>

                                  {/* Availability bar */}
                                  <div className="mt-2">
                                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className={`h-1.5 rounded-full ${available > 0 ? "bg-green-500" : "bg-gray-400"}`}
                                        style={{ width: `${totalBeds > 0 ? (available / totalBeds) * 100 : 0}%` }}
                                      />
                                    </div>
                                  </div>

                                  {/* Price */}
                                  <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-base font-bold text-foreground">{formatCurrency(option.price_monthly)}</span>
                                    <span className="text-xs text-muted-foreground">/month</span>
                                    {option.price_daily > 0 && (
                                      <span className="text-xs text-muted-foreground ml-1">({formatCurrency(option.price_daily)}/day)</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {/* Stay Duration Packages */}
                            {selectedSharingOption && selectedRoomId === room.id && (
                              <div className="mt-2">
                                <Separator className="mb-3" />
                                <StayDurationPackages
                                  hostelId={hostel.id}
                                  monthlyPrice={selectedSharingOption.price_monthly}
                                  selectedPackage={selectedStayPackage}
                                  onSelectPackage={setSelectedStayPackage}
                                />
                              </div>
                            )}

                            {/* View Bed Map */}
                            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setIsBedMapOpen(true)}>
                              <MapPin className="mr-1.5 h-3.5 w-3.5" />
                              View Bed Map
                            </Button>

                            {/* Book Now */}
                            <Button
                              className="w-full"
                              size="sm"
                              disabled={!selectedSharingOption || selectedRoomId !== room.id || getAvailableCount(selectedSharingOption) <= 0}
                              onClick={() => handleBookNow(room)}
                            >
                              <CreditCard className="mr-1.5 h-4 w-4" />
                              Book Now
                            </Button>

                            {(!selectedSharingOption || selectedRoomId !== room.id) && (
                              <p className="text-[11px] text-center text-muted-foreground">Select a sharing option above</p>
                            )}

                            {/* Contact for short stays */}
                            {hostel.contact_phone && (
                              <div className="text-center p-2 bg-muted/50 rounded-lg">
                                <p className="text-[11px] text-muted-foreground">
                                  For stays &lt; 30 days, call{" "}
                                  <a href={`tel:${hostel.contact_phone}`} className="text-primary font-medium">
                                    <Phone className="h-3 w-3 inline mr-0.5" />
                                    {hostel.contact_phone}
                                  </a>
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <Info className="h-8 w-8 mx-auto text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">No sharing options available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══ Bed Map Dialog ═══ */}
        <Dialog open={isBedMapOpen} onOpenChange={setIsBedMapOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bed Map - {hostel?.name}</DialogTitle>
            </DialogHeader>
            {hostel && <HostelBedMap hostelId={hostel.id} readOnly />}
          </DialogContent>
        </Dialog>

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
