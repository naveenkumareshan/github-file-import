
import React, { useState } from 'react';
import { Button } from './ui/button';
import { MapPin } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface LocationDetails {
  lat: number;
  lng: number;
  address: string;
}

interface LaundryMapLocationProps {
  onLocationSelect: (location: LocationDetails) => void;
}

export function LaundryMapLocation({ onLocationSelect }: LaundryMapLocationProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationDetails | null>(null);

  const handleConfirmLocation = () => {
    // Placeholder for future location selection logic
    const dummyLocation = {
      lat: 0,
      lng: 0,
      address: 'Campus Area, Main Building'
    };
    setSelectedLocation(dummyLocation);
    onLocationSelect(dummyLocation);
  };

  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Interactive map coming soon. For now, you can select a default location.
          </p>
          {selectedLocation ? (
            <div className="text-sm">
              <p className="font-medium flex items-center justify-center gap-2 mb-2">
                <MapPin className="h-4 w-4" /> 
                {selectedLocation.address}
              </p>
              <Button 
                onClick={handleConfirmLocation} 
                className="w-full"
                variant="outline"
              >
                Change Location
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleConfirmLocation} 
              className="w-full"
              variant="secondary"
            >
              Select Campus Location
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
