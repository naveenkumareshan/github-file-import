
import React, { useState, useEffect } from 'react';
import { MapPin, Clock } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LocationDetails {
  roomNumber: string;
  block: string;
  floor: string;
  pickupTime?: string;
}

interface LaundryLocationModalProps {
  onLocationSubmit: (location: LocationDetails) => void;
}

export function LaundryLocationModal({ onLocationSubmit }: LaundryLocationModalProps) {
  const [location, setLocation] = useState<LocationDetails>({
    roomNumber: '',
    block: '',
    floor: '',
    pickupTime: '',
  });
  const [savedLocations, setSavedLocations] = useState<LocationDetails[]>([]);
  const [selectedSavedLocation, setSelectedSavedLocation] = useState<string | null>(null);

  // Load saved locations from localStorage on component mount
  useEffect(() => {
    const savedLocationsString = localStorage.getItem('savedLocations');
    if (savedLocationsString) {
      setSavedLocations(JSON.parse(savedLocationsString));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save the location if it's not already saved
    if (!savedLocations.some(loc => 
      loc.roomNumber === location.roomNumber && 
      loc.block === location.block && 
      loc.floor === location.floor
    )) {
      const newSavedLocations = [...savedLocations, location];
      setSavedLocations(newSavedLocations);
      localStorage.setItem('savedLocations', JSON.stringify(newSavedLocations));
      toast.success("Location Saved", {
        description: "Your location has been saved for future use.",
      });
    }
    
    onLocationSubmit(location);
  };

  const handleSelectSavedLocation = (locationString: string) => {
    const index = parseInt(locationString);
    if (!isNaN(index) && index >= 0 && index < savedLocations.length) {
      setLocation(savedLocations[index]);
      setSelectedSavedLocation(locationString);
    }
  };

  // Available pickup time slots
  const timeSlots = [
    "08:00 AM - 10:00 AM",
    "10:00 AM - 12:00 PM",
    "12:00 PM - 02:00 PM",
    "02:00 PM - 04:00 PM",
    "04:00 PM - 06:00 PM"
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MapPin className="h-4 w-4" />
          Add Pickup Location
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Enter Pickup Location</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {savedLocations.length > 0 && (
            <div>
              <label className="text-sm font-medium">Saved Locations</label>
              <Select 
                value={selectedSavedLocation || undefined} 
                onValueChange={handleSelectSavedLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a saved location" />
                </SelectTrigger>
                <SelectContent>
                  {savedLocations.map((loc, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      Room {loc.roomNumber}, Block {loc.block}, Floor {loc.floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium">Room Number</label>
            <Input
              value={location.roomNumber}
              onChange={(e) => setLocation({ ...location, roomNumber: e.target.value })}
              placeholder="Enter room number"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Block</label>
            <Input
              value={location.block}
              onChange={(e) => setLocation({ ...location, block: e.target.value })}
              placeholder="Enter block name/number"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Floor</label>
            <Input
              value={location.floor}
              onChange={(e) => setLocation({ ...location, floor: e.target.value })}
              placeholder="Enter floor number"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pickup Time
            </label>
            <Select 
              value={location.pickupTime} 
              onValueChange={(value) => setLocation({ ...location, pickupTime: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pickup time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Save Location</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
