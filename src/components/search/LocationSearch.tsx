
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Filter, Navigation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationSelector } from '@/components/forms/LocationSelector';
import { useLocations } from '@/hooks/useLocations';

interface LocationSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onLocationSelect: (location: { lat: number; lng: number }) => void;
  loading?: boolean;
}

interface SearchFilters {
  query: string;
  stateId: string;
  cityId: string;
  areaId: string;
  radius: string;
  priceRange: { min: number; max: number };
  amenities: string[];
  category: string;
  sortBy: 'distance' | 'price' | 'rating' | 'name';
  userLocation?: { lat: number; lng: number };
}

const commonAmenities = [
  'Wi-Fi', 'Air Conditioning', 'Power Backup', 'CCTV', 'Parking',
  'Cafeteria', 'Library', 'Study Materials', '24/7 Access', 'Lockers'
];

export const LocationSearch = ({ onSearch, onLocationSelect, loading }: LocationSearchProps) => {
  const { getLocationById } = useLocations();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    stateId: '',
    cityId: '',
    areaId: '',
    radius: '5',
    priceRange: { min: 0, max: 10000 },
    amenities: [],
    category: '',
    sortBy: 'distance'
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setFilters(prev => ({ ...prev, userLocation: location }));
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }
  }, []);

  const handleSearch = () => {
    onSearch({
      ...filters,
      amenities: selectedAmenities,
      userLocation
    });
  };

  const handleLocationDetect = () => {
    if (userLocation) {
      onLocationSelect(userLocation);
      handleSearch();
    }
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const getLocationCoordinates = () => {
    if (filters.areaId) {
      const area = getLocationById('area', filters.areaId);
      if (area && 'latitude' in area && area.latitude && area.longitude) {
        return { lat: area.latitude, lng: area.longitude };
      }
    }
    if (filters.cityId) {
      const city = getLocationById('city', filters.cityId);
      if (city && 'latitude' in city && city.latitude && city.longitude) {
        return { lat: city.latitude, lng: city.longitude };
      }
    }
    return null;
  };

  const handleLocationSearch = () => {
    const coordinates = getLocationCoordinates();
    if (coordinates) {
      onLocationSelect(coordinates);
    }
    handleSearch();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Main search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search reading rooms, areas, or landmarks..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
           
          </div>

          {/* Location Selector */}
          <LocationSelector
            selectedCountry={'684063018f9d4f4736616a42'}
            selectedState={filters.stateId}
            selectedCity={filters.cityId}
            selectedArea={filters.areaId}
            onStateChange={(stateId) => setFilters(prev => ({ ...prev, stateId, cityId: '', areaId: '' }))}
            onCityChange={(cityId) => setFilters(prev => ({ ...prev, cityId, areaId: '' }))}
            onAreaChange={(areaId) => setFilters(prev => ({ ...prev, areaId }))}
            showCountry={false}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
          {/* Location buttons */}
          <div className="flex items-center gap-2">
            {/* <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLocationDetect}
              disabled={!userLocation}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Near Me
            </Button> */}
            
            {/* <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLocationSearch}
              disabled={!filters.cityId}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Search Location
            </Button> */}
            
            {/* {userLocation && (
              <span className="text-sm text-muted-foreground">
                Location detected
              </span>
            )} */}
          </div>

          {/* Advanced filters toggle */}
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </Button> */}

          {/* Advanced filters */}
          {showAdvancedFilters && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Price Range (₹/month)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange.min}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        priceRange: { ...prev.priceRange, min: parseInt(e.target.value) || 0 }
                      }))}
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange.max}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        priceRange: { ...prev.priceRange, max: parseInt(e.target.value) || 10000 }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select 
                    value={filters.category} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="luxury">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                  <div>
                  <label className="text-sm font-medium mb-2 block">Radius</label>
                  <Select 
                    value={filters.radius} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, radius: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='5'>5 KM</SelectItem>
                      <SelectItem value="10">10 KM</SelectItem>
                      <SelectItem value="15">15 KM</SelectItem>
                      <SelectItem value="20">20 KM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value as any }))}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {commonAmenities.map(amenity => (
                    <Badge
                      key={amenity}
                      variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleAmenity(amenity)}
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
