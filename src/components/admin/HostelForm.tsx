import React, { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { hostelService } from "@/api/hostelService";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ImageUpload";
import MapPicker from "./MapPicker";
import { LocationSelector } from "../forms/LocationSelector";

interface HostelFormProps {
  initialData?: HostelData;
  onSuccess: () => void;
  hostelId?: string;
}

export interface HostelData {
  _id?: string;
  id?: string;
  name: string;
  location: string;
  description?: string;
  city: any;
  area: any;
  locality: string;
  state: any;
  country: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  logoImage?: string;
  // New fields
  stayType?: "Short-term" | "Long-term" | "Both";
  gender?: "Male" | "Female" | "Co-ed";
  amenities?: string[];
  images?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export const HostelForm: React.FC<HostelFormProps> = ({
  initialData,
  hostelId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<HostelData>({
    name: "",
    location: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    isActive: true,
    logoImage: "",
    stayType: "Both",
    gender: "Co-ed",
    city: "",
    area: "",
    locality: "",
    state: "",
    country: "684063018f9d4f4736616a42",
    amenities: [],
    images: [],
    coordinates: {
      lat: 0,
      lng: 0,
    },
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        stayType: initialData.stayType || "Both",
        gender: initialData.gender || "Co-ed",
        locality: initialData.locality || "",
        area: initialData.area || "",
        city: initialData.city || "",
        state: initialData?.state || "",
        country: initialData?.country || "India",
        amenities: initialData.amenities || [],
        images: initialData.images || [],
        coordinates: initialData.coordinates || { lat: 0, lng: 0 },
      });
    }
  }, [initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => {
      const currentAmenities = prev.amenities || [];
      if (currentAmenities.includes(amenity)) {
        return {
          ...prev,
          amenities: currentAmenities.filter((a) => a !== amenity),
        };
      } else {
        return { ...prev, amenities: [...currentAmenities, amenity] };
      }
    });
  };

  const handleImageUpload = (url: string) => {
    const updatedImages = [...(formData.images || []), url];
    setFormData((prev) => ({ ...prev, logoImage: url, images: updatedImages }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log(formData);
    try {
      let response;

      if (hostelId) {
        response = await hostelService.updateHostel(hostelId, formData);
      } else {
        response = await hostelService.createHostel(formData);
      }

      if (response.success) {
        toast({
          title: "Success",
          description: hostelId
            ? "Hostel updated successfully"
            : "Hostel created successfully",
        });
        onSuccess();
      } else {
        throw new Error(response.message || "Failed to save hostel");
      }
    } catch (error) {
      console.error("Error saving hostel:", error);
      toast({
        title: "Error",
        description: `Failed to ${hostelId ? "update" : "create"} hostel`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleMapLocationChange = (coordinates: {
    lat: number;
    lng: number;
  }) => {
    setFormData((prev) => ({ ...prev, coordinates: coordinates }));
  };

  const amenityOptions = [
    { id: "wifi", label: "WiFi" },
    { id: "ac", label: "Air Conditioning" },
    { id: "gym", label: "Gym" },
    { id: "laundry", label: "Laundry" },
    { id: "food", label: "Food Service" },
    { id: "study-room", label: "Study Room" },
    { id: "tv-room", label: "TV Room" },
    { id: "parking", label: "Parking" },
    { id: "security", label: "24/7 Security" },
    { id: "power-backup", label: "Power Backup" },
    { id: "housekeeping", label: "Housekeeping" },
    { id: "recreation", label: "Recreation Area" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6  h-[500px] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Hostel Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location Address</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
            />
          </div>
           <div>
      <Label htmlFor="locality">Locality/Area</Label>
      <Input
        id="locality"
        name="locality"
        value={formData.locality}
        onChange={handleInputChange}
        required
        placeholder="e.g., Gachibowli, Madhapur"
      />
    </div>
{/*
    <div>
      <Label htmlFor="city">City</Label>
      <Input
        id="city"
        name="city"
        value={formData.city}
        onChange={handleInputChange}
        required
        placeholder="e.g., Hyderabad, Bangalore"
      />
    </div>


        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            required
            placeholder="e.g., Telangana" />
        </div>


        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            onChange={handleInputChange}
            value={formData.country}
            required
            defaultValue="India" />
        </div> */}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="stayType">Stay Type</Label>
            <Select
              value={formData.stayType}
              onValueChange={(value) => handleSelectChange("stayType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stay type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Short-term">Short-term</SelectItem>
                <SelectItem value="Long-term">Long-term</SelectItem>
                <SelectItem value="Both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Co-ed">Co-ed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="contactPhone">Phone</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {amenityOptions.map((amenity) => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={formData.amenities?.includes(amenity.id)}
                    onCheckedChange={() => handleAmenityToggle(amenity.id)}
                  />
                  <Label
                    htmlFor={`amenity-${amenity.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {amenity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={handleSwitchChange}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div>
            <Label htmlFor="logoImage">Hostel Logo</Label>
            <div className="mt-1">
              <ImageUpload
                onUpload={handleImageUpload}
                existingImages={[
                  ...(formData.logoImage ? [formData.logoImage] : []), // single logo
                  ...(formData.images || []),                          // multiple images
                ]}
                maxCount={5}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <MapPicker
          initialLocation={
            formData.coordinates ? formData.coordinates : undefined
          }
          name={formData.name}
          onLocationSelect={handleMapLocationChange}
        />
      </div>
      <div>
        <div>
          <LocationSelector
            selectedCountry={"684063018f9d4f4736616a42"}
            selectedState={
              formData?.state?._id ? formData?.state?._id : formData?.state
            }
            selectedCity={
              formData.city?._id ? formData.city?._id : formData.city
            }
            selectedArea={
              formData.area?._id ? formData.area?._id : formData.area
            }
            onStateChange={(state) => {
              if (state) {
                setFormData((prev) => ({ ...prev, state, city: "", area: "" }));
              }
            }}
            onCityChange={(city) => {
              if (city) {
                setFormData((prev) => ({ ...prev, city, area: "" }));
              }
            }}
            onAreaChange={(area) => {
              if (area) {
                setFormData((prev) => ({ ...prev, area }));
              }
            }}
            showCountry={false}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : hostelId ? "Update Hostel" : "Create Hostel"}
        </Button>
      </div>
    </form>
  );
};
