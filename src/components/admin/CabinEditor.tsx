import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { RoomSeat } from "../RoomSeatButton";
import {
  ArrowLeft,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { LocationSelector } from "../forms/LocationSelector";
import MapPicker from "./MapPicker";

import { getImageUrl } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CabinEditorProps {
  onSave: (cabin: any) => void;
  onCancel: () => void;
  existingCabin?: any;
  isAdmin?: boolean; // Add the isAdmin prop
}

export function CabinEditor({
  onSave,
  onCancel,
  existingCabin,
  isAdmin = true,
}: CabinEditorProps) {
  const { user } = useAuth();
  const [cabin, setCabin] = useState({
    id: existingCabin?.id || Math.floor(Math.random() * 1000),
    name: existingCabin?.name || "",
    description: existingCabin?.description || "",
    price: existingCabin?.price || 2000,
    capacity: existingCabin?.capacity || 16,
    category: existingCabin?.category || "standard",
    amenities: existingCabin?.amenities || ["Wi-Fi", "Desk", "Bookshelf"],
    imageUrl: existingCabin?.imageUrl || "",
    imageSrc: existingCabin?.images?.length > 0  ? existingCabin?.images[0] :existingCabin?.imageSrc,
    images: existingCabin?.images || [],
    ownerName: existingCabin?.ownerDetails?.ownerName || "",
    ownerPhone: existingCabin?.ownerDetails?.ownerPhone || "",
    ownerEmail: existingCabin?.ownerDetails?.ownerEmail || "",
    aadharNumber: existingCabin?.ownerDetails?.aadharNumber || "",
    panNumber: existingCabin?.ownerDetails?.panNumber || "",
    accountHolderName: existingCabin?.ownerDetails?.bankDetails?.accountHolderName || "",
    accountNumber: existingCabin?.ownerDetails?.bankDetails?.accountNumber || "",
    ifscCode: existingCabin?.ownerDetails?.bankDetails?.ifscCode || "",
    bankName: existingCabin?.ownerDetails?.bankDetails?.bankName || "",
    branchName: existingCabin?.ownerDetails?.bankDetails?.branchName || "",
    accountType: existingCabin?.ownerDetails?.bankDetails?.accountType || "",
    upiId: existingCabin?.ownerDetails?.bankDetails?.upiId || "",
    fullAddress: existingCabin?.location?.fullAddress || existingCabin?.full_address || existingCabin?.fullAddress || "",
    city: existingCabin?.location?.city || existingCabin?.location?.city?._id || existingCabin?.city,
    state: existingCabin?.location?.state || existingCabin?.location?.state?._id || existingCabin?.state,
    pincode: existingCabin?.location?.pincode || "",
    latitude: existingCabin?.location?.coordinates?.latitude || 0,
    longitude: existingCabin?.location?.coordinates?.longitude || 0,
    area: existingCabin?.location?.area || existingCabin?.location?.area?._id || existingCabin?.area,
    locality: existingCabin?.location?.locality || "",
    nearbyLandmarks: existingCabin?.location?.nearbyLandmarks || [],
    lockerAvailable: existingCabin?.lockerAvailable ?? existingCabin?.locker_available ?? false,
    lockerPrice: existingCabin?.lockerPrice ?? existingCabin?.locker_price ?? 0,
    lockerMandatory: existingCabin?.lockerMandatory ?? existingCabin?.locker_mandatory ?? true,
    created_by: existingCabin?.created_by || "",
    advanceBookingEnabled: existingCabin?.advanceBookingEnabled ?? existingCabin?.advance_booking_enabled ?? false,
    advancePercentage: existingCabin?.advancePercentage ?? existingCabin?.advance_percentage ?? 50,
    advanceFlatAmount: existingCabin?.advanceFlatAmount ?? existingCabin?.advance_flat_amount ?? 0,
    advanceUseFlat: existingCabin?.advanceUseFlat ?? existingCabin?.advance_use_flat ?? false,
    advanceValidityDays: existingCabin?.advanceValidityDays ?? existingCabin?.advance_validity_days ?? 3,
    advanceAutoCancel: existingCabin?.advanceAutoCancel ?? existingCabin?.advance_auto_cancel ?? true,
  });

  // Partner details state
  const [partners, setPartners] = useState<Array<{ id: string; name: string; email: string; phone: string; serial_number: string }>>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>(existingCabin?.created_by || "");
  const [partnerDetails, setPartnerDetails] = useState<{ name: string; email: string; phone: string; serial_number: string } | null>(null);

  // Fetch partners (vendors) for admin
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        // Get all users with vendor role
        const { data: vendorRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'vendor');

        if (!vendorRoles || vendorRoles.length === 0) return;

        const vendorIds = vendorRoles.map(r => r.user_id);

        // Also include admin users
        const { data: adminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin');

        const allIds = [...vendorIds, ...(adminRoles || []).map(r => r.user_id)];
        const uniqueIds = [...new Set(allIds)];

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email, phone, serial_number')
          .in('id', uniqueIds);

        setPartners((profiles || []).map(p => ({
          id: p.id,
          name: p.name || 'Unknown',
          email: p.email || '',
          phone: p.phone || '',
          serial_number: p.serial_number || '',
        })));
      } catch (err) {
        console.error('Error fetching partners:', err);
      }
    };

    if (isAdmin) {
      fetchPartners();
    }
  }, [isAdmin]);

  // Load partner details when selected
  useEffect(() => {
    if (selectedPartner) {
      const partner = partners.find(p => p.id === selectedPartner);
      if (partner) {
        setPartnerDetails(partner);
        setCabin(prev => ({ ...prev, created_by: selectedPartner }));
      }
    } else if (!isAdmin && user?.id) {
      // For partners, auto-fill their own details
      const loadOwnProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('id, name, email, phone, serial_number')
          .eq('id', user.id)
          .single();
        if (data) {
          setPartnerDetails({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            serial_number: data.serial_number || '',
          });
          setCabin(prev => ({ ...prev, created_by: user.id }));
          setSelectedPartner(user.id);
        }
      };
      loadOwnProfile();
    }
  }, [selectedPartner, partners, isAdmin, user?.id]);

  const [seats, setSeats] = useState<RoomSeat[]>([]);
  const [activeTab, setActiveTab] = useState("details");
  const [editor, setEditor] = useState({
    width: 600,
    height: 400,
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCabin({
      ...cabin,
      [name]: name === "price" || name === "capacity" ? Number(value) : value,
    });
    // Clear validation error when user makes changes
    setValidationError(null);
  };

  const handleAmenityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (e.target.checked) {
      setCabin({ ...cabin, amenities: [...cabin.amenities, value] });
    } else {
      setCabin({
        ...cabin,
        amenities: cabin.amenities.filter((a) => a !== value),
      });
    }
    // Clear validation error when user makes changes
    setValidationError(null);
  };

  const handleImageUpload = (url: string) => {
    // Add the new image to the images array
    const updatedImages = [...(cabin.images || []), url];
    setCabin({
      ...cabin,
      imageUrl: url, // Set as main image
      images: updatedImages,
    });
    // Clear validation error when user makes changes
    setValidationError(null);
  };

  const handleImageRemove = (url: string) => {
    // Remove the image from the images array
    const updatedImages = (cabin.images || []).filter((img) => img !== url);

    // If the removed image was the main image, update it to another image or placeholder
    const newMainImage =
      url === cabin.imageUrl
        ? updatedImages.length > 0
          ? updatedImages[0]
          : ""
        : cabin.imageUrl;

    setCabin({
      ...cabin,
      imageUrl: newMainImage,
      images: updatedImages,
    });
  };

  const handleSave = () => {
    // Validate required fields
    if (!cabin.name) {
      setValidationError("Reading room name is required");
      setActiveTab("details");
      return;
    }

    if (!cabin.description) {
      setValidationError("Description is required");
      setActiveTab("details");
      return;
    }

    if (!cabin.price || cabin.price <= 0) {
      setValidationError("Valid price is required");
      setActiveTab("details");
      return;
    }

    if ((!cabin.images || cabin.images.length === 0) && (!cabin.imageUrl || cabin.imageUrl === "/placeholder.svg")) {
      setValidationError("Please upload at least one image");
      setActiveTab("details");
      return;
    }

    // Clear validation error
    setValidationError(null);
    setIsSaving(true);

    // Save cabin data
    setTimeout(() => {
      onSave({
       ...cabin,
      });

      toast({
        title: "Reading Room Saved",
        description: `${existingCabin ? "Updated" : "Created"} reading room "${
          cabin.name
        }" successfully.`,
      });
      setIsSaving(false);
    }, 500); // Small timeout to show saving state
  };

  const handleCancel = () => {
     onCancel();
  };

  const handleMapLocationChange = (coordinates: { lat: number; lng: number }) => {
    setCabin({...cabin,  latitude: coordinates.lat, longitude: coordinates.lng });
  };

  const handleLockerAvailableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    setCabin((prev) => ({
      ...prev,
      [name]: checked,
      // reset locker price if unchecked
      ...(name === "lockerAvailable" && !checked && { lockerPrice: "" })
    }));
  };

  // Get all images for display in the upload section (filter out falsy values)
  const allImages =
    cabin.imageUrl && cabin.imageUrl !== "/placeholder.svg"
      ? Array.from(new Set([cabin.imageSrc, ...(cabin.images || [])])).filter(Boolean)
      : (cabin.images || []).filter(Boolean);

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>
              {existingCabin ? "Edit" : "Create"} Reading Room
            </CardTitle>
            <CardDescription>
              {existingCabin
                ? "Modify reading room details and pricing."
                : "Add a new reading room with all required details."}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {validationError && (
          <div className="mb-6 p-4 bg-[#FFDEE2] border border-pink-300 rounded-md text-pink-800">
            <p className="font-medium">Please correct the following:</p>
            <p>{validationError}</p>
          </div>
        )}

        <Tabs
          defaultValue="details"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="details">Reading Room Details</TabsTrigger>
            <TabsTrigger value="owner">Contact Person Details</TabsTrigger>
            <TabsTrigger value="partner">Partner Details</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Reading Room Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={cabin.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Literary Lounge"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    value={cabin.category}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="capacity">Seat Capacity *</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={cabin.capacity}
                    onChange={handleInputChange}
                    required
                    min={1}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={cabin.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Describe the reading room features and benefits"
                    required
                  />
                </div>
                <div>
                  <Label className="text-lg font-medium mb-2 block">
                    Amenities
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {[
                      "Wi-Fi",
                      "Desk",
                      "Bookshelf",
                      "Power Outlet",
                      "Reading Lamp",
                      "Air Conditioning",
                      "Coffee Station",
                      "Locker",
                      "Printing Service",
                      "Quiet Zone",
                      "24/7 Access",
                      "Study Materials",
                      "Ergonomic Chair",
                      "Natural Lighting",
                      "Private Space",
                    ].map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center space-x-2 bg-white p-2 rounded-md border"
                      >
                        <input
                          type="checkbox"
                          id={`amenity-${amenity}`}
                          value={amenity}
                          checked={cabin.amenities.includes(amenity)}
                          onChange={handleAmenityChange}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`amenity-${amenity}`}
                          className="text-sm cursor-pointer"
                        >
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-lg font-medium">Locker</Label>

                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="lockerAvailable"
                      name="lockerAvailable"
                      checked={cabin.lockerAvailable}
                      onChange={handleLockerAvailableChange}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="lockerAvailable" className="text-sm cursor-pointer">
                      Locker Available
                    </Label>
                  </div>

                  {cabin.lockerAvailable && (
                    <>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-lg">₹</span>
                        <Input
                          id="lockerPrice"
                          name="lockerPrice"
                          type="number"
                          value={cabin.lockerPrice}
                          onChange={handleInputChange}
                          className="text-lg"
                          min={1}
                          required
                        />
                        <span className="text-lg">/month</span>
                      </div>
                      <div className="mt-3">
                        <Label className="text-sm font-medium mb-2 block">Locker Requirement</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="lockerMandatory"
                              checked={cabin.lockerMandatory === true}
                              onChange={() => setCabin(prev => ({ ...prev, lockerMandatory: true }))}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Mandatory for Student</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="lockerMandatory"
                              checked={cabin.lockerMandatory === false}
                              onChange={() => setCabin(prev => ({ ...prev, lockerMandatory: false }))}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Optional for Student</span>
                          </label>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {cabin.lockerMandatory 
                          ? "Students must pay locker deposit during booking" 
                          : "Students can choose whether to add a locker"}
                      </p>
                    </>
                  )}
                </div>

                {/* Advance Booking Settings */}
                <div className="border rounded-lg p-4 space-y-3">
                  <Label className="text-lg font-medium">Advance Booking</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="advanceBookingEnabled"
                      checked={cabin.advanceBookingEnabled}
                      onChange={(e) => setCabin(prev => ({ ...prev, advanceBookingEnabled: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="advanceBookingEnabled" className="text-sm cursor-pointer">
                      Allow Advance Booking
                    </Label>
                  </div>

                  {cabin.advanceBookingEnabled && (
                    <div className="space-y-3 pl-2 border-l-2 border-primary/20 ml-2">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Advance Type</Label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="advanceType"
                              checked={!cabin.advanceUseFlat}
                              onChange={() => setCabin(prev => ({ ...prev, advanceUseFlat: false }))}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Percentage (%)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="advanceType"
                              checked={cabin.advanceUseFlat}
                              onChange={() => setCabin(prev => ({ ...prev, advanceUseFlat: true }))}
                              className="h-4 w-4"
                            />
                            <span className="text-sm">Flat Amount (₹)</span>
                          </label>
                        </div>
                      </div>

                      {!cabin.advanceUseFlat ? (
                        <div>
                          <Label htmlFor="advancePercentage" className="text-sm">Advance Percentage (%)</Label>
                          <Input
                            id="advancePercentage"
                            type="number"
                            min={1}
                            max={99}
                            value={cabin.advancePercentage}
                            onChange={e => setCabin(prev => ({ ...prev, advancePercentage: Number(e.target.value) }))}
                          />
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="advanceFlatAmount" className="text-sm">Flat Advance Amount (₹)</Label>
                          <Input
                            id="advanceFlatAmount"
                            type="number"
                            min={1}
                            value={cabin.advanceFlatAmount}
                            onChange={e => setCabin(prev => ({ ...prev, advanceFlatAmount: Number(e.target.value) }))}
                          />
                        </div>
                      )}

                      <div>
                        <Label htmlFor="advanceValidityDays" className="text-sm">Advance Validity (days)</Label>
                        <Input
                          id="advanceValidityDays"
                          type="number"
                          min={1}
                          value={cabin.advanceValidityDays}
                          onChange={e => setCabin(prev => ({ ...prev, advanceValidityDays: Number(e.target.value) }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Due must be paid within this many days of booking start date
                        </p>
                      </div>

                      <div className="flex items-center gap-2 opacity-60">
                        <input
                          type="checkbox"
                          id="advanceAutoCancel"
                          checked={cabin.advanceAutoCancel}
                          onChange={(e) => setCabin(prev => ({ ...prev, advanceAutoCancel: e.target.checked }))}
                          className="h-4 w-4"
                          disabled
                        />
                        <Label htmlFor="advanceAutoCancel" className="text-sm cursor-pointer">
                          Auto-cancel if unpaid <span className="text-xs text-muted-foreground">(Coming Soon)</span>
                        </Label>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="price" className="text-lg font-medium">
                    Starting Price (₹) *
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg">₹</span>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={cabin.price}
                      onChange={handleInputChange}
                      className="text-lg"
                      required
                      min={1}
                    />
                    <span className="text-lg">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    This is the starting base price shown to students. Actual seat prices are set via categories.
                  </p>
                </div>
                <div>
                  <Label>Reading Room Images *</Label>
                  <div className="border rounded-md p-4">
                    {cabin.imageUrl &&
                      cabin.imageUrl !== "/placeholder.svg" && (
                        <div className="aspect-video mb-4 overflow-hidden rounded-md">
                          <img
                            src={getImageUrl(cabin.imageSrc)}
                            alt={cabin.name}
                            className="w-full h-full object-cover"
                          />
                          <p className="text-xs text-center mt-1 text-gray-500">
                            Main Image
                          </p>
                        </div>
                      )}
                    <ImageUpload
                      onUpload={handleImageUpload}
                      onRemove={handleImageRemove}
                      existingImages={allImages}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

<TabsContent value="owner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Person Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ownerName">Contact Person Name *</Label>
                    <Input
                      id="ownerName"
                      name="ownerName"
                      value={cabin.ownerName}
                      onChange={handleInputChange}
                      placeholder="Contact Person name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerPhone">Contact Person Phone *</Label>
                    <Input
                      id="ownerPhone"
                      name="ownerPhone"
                      value={cabin.ownerPhone}
                      onChange={handleInputChange}
                      placeholder="Enter phone number"
                      required
                      type="number"
                      maxLength={10}
                      minLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerEmail">Contact Person Email *</Label>
                    <Input
                      id="ownerEmail"
                      name="ownerEmail"
                      value={cabin.ownerEmail}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      required
                      type="email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partner" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Partner Details</CardTitle>
                <CardDescription>
                  {isAdmin 
                    ? "Select or assign a partner for this reading room." 
                    : "Your partner details linked to this reading room."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin && (
                  <div>
                    <Label>Select Partner *</Label>
                    <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a partner" />
                      </SelectTrigger>
                      <SelectContent>
                        {partners.map((partner) => (
                          <SelectItem key={partner.id} value={partner.id}>
                            {partner.name} ({partner.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {partnerDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Partner Name</Label>
                      <Input value={partnerDetails.name} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Partner Email</Label>
                      <Input value={partnerDetails.email} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Partner Phone</Label>
                      <Input value={partnerDetails.phone} readOnly className="bg-muted" />
                    </div>
                    <div>
                      <Label>Partner ID</Label>
                      <Input value={partnerDetails.serial_number} readOnly className="bg-muted" />
                    </div>
                  </div>
                )}

                {!partnerDetails && !isAdmin && (
                  <p className="text-muted-foreground">Loading your partner details...</p>
                )}

                {!partnerDetails && isAdmin && !selectedPartner && (
                  <p className="text-muted-foreground">Please select a partner to see their details.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <LocationSelector
                    selectedCountry={'684063018f9d4f4736616a42'}
                    selectedState={cabin?.state?._id ? cabin?.state?._id : cabin?.state}
                    selectedCity={cabin.city?._id ? cabin.city?._id : cabin.city}
                    selectedArea={cabin.area?._id ? cabin.area?._id : cabin.area}
                    onStateChange={(state) => {
                      if (state) {
                        setCabin(prev => ({ ...prev, state, city: '', area: '' }));
                      }
                    }}

                    onCityChange={(city) => {
                      if (city) {
                        setCabin(prev => ({ ...prev, city, area: '' }));
                      }
                    }}

                    onAreaChange={(area) => {
                      if (area) {
                        setCabin(prev => ({ ...prev, area }));
                      }
                    }}

                    showCountry={false}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                  <Label htmlFor="fullAddress">Full Address *</Label>
                  <Textarea
                    id="fullAddress"
                    name="fullAddress"
                    value={cabin.fullAddress}
                    onChange={handleInputChange}
                    placeholder="Enter complete address"
                    required
                  />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode *</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={cabin.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter Pincode"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  

                  <div>
                    <Label htmlFor="locality">Specific Locality</Label>
                    <Input
                      id="locality"
                      name="locality"
                      value={cabin.locality}
                      onChange={handleInputChange}
                      placeholder="Enter specific locality"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      value={cabin.latitude}
                      onChange={handleInputChange}
                      placeholder="Enter latitude"
                    />
                  </div>

                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      value={cabin.longitude}
                      onChange={handleInputChange}
                      placeholder="Enter longitude"
                    />
                  </div>
                  <div>

                    <MapPicker
                      initialLocation={cabin.longitude ? {    lat: cabin.latitude, lng: cabin.longitude  } : undefined}
                      name={cabin.name}
                      onLocationSelect={handleMapLocationChange}
                    /> 
                  </div>
                </div>

                

                <div>
                  <Label htmlFor="nearbyLandmarks">Nearby Landmarks</Label>
                  <Input
                    id="nearbyLandmarks"
                    name="nearbyLandmarks"
                    value={cabin.nearbyLandmarks}
                    onChange={handleInputChange}
                    placeholder="Enter landmarks separated by commas"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : existingCabin ? "Update" : "Create"}
        </Button>
      </CardFooter>
    </Card>
  );
}
