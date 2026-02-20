
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { Footer } from '@/components/Footer';
import { Search, MapPin, Hotel, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function Hostels() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [popularLocations, setPopularLocations] = useState<string[]>([]);
  const [popularCities, setPopularCities] = useState<string[]>([]);
  const [genderFilter, setGenderFilter] = useState('');
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Check if city is passed in URL
    const queryParams = new URLSearchParams(location.search);
    const cityParam = queryParams.get('city');
    if (cityParam) {
      setCityFilter(cityParam);
    }

    fetchHostels(cityParam || '');
  }, [location.search, toast]);

  const fetchHostels = async (city: string = '') => {
    try {
      setLoading(true);
      const filters = city ? { city } : {};
      const response = await hostelService.getAllHostels(filters);
      setHostels(response.data || []);
      
      // Extract unique locations and cities for filtering
      if (response.data && response.data.length > 0) {
        const locations = response.data
          .map((hostel: any) => hostel.locality)
          .filter((location: string, index: number, self: string[]) => 
            location && self.indexOf(location) === index
          );
        
        // const cities = response.data
        //   .map((hostel: any) => city?.name)
        //   .filter((city: string, index: number, self: string[]) => 
        //     city && self.indexOf(city) === index
        //   );
        
        setPopularLocations(locations.slice(0, 5));
        // setPopularCities(cities);
      }
    } catch (err: any) {
      console.error('Error fetching hostels:', err);
      setError(err.message || 'Failed to fetch hostels');
      toast({
        title: 'Error',
        description: 'Failed to load hostels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewRooms = (hostelId: string) => {
    navigate(`/hostels/${hostelId}`);
  };

  const handleLocationFilter = (location: string) => {
    setLocationFilter(location === locationFilter ? '' : location);
  };

  const handleCityChange = (city: string) => {
    setCityFilter(city);
    // Update URL to reflect city filter
    navigate(`/hostels?city=${city}`);
    fetchHostels(city);
  };

  const handleGenderFilter = (gender: string) => {
    setGenderFilter(gender === genderFilter ? '' : gender);
  };

  const handleFindNearby = () => {
    if (navigator.geolocation) {
      setNearbyLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await hostelService.getNearbyHostels(latitude, longitude);
            setHostels(response.data || []);
            setLocationFilter('');
            setCityFilter('');
            toast({
              title: 'Location Found',
              description: 'Showing hostels near your current location'
            });
          } catch (err: any) {
            console.error('Error fetching nearby hostels:', err);
            toast({
              title: 'Error',
              description: 'Failed to find nearby hostels',
              variant: 'destructive'
            });
          } finally {
            setNearbyLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast({
            title: 'Location Error',
            description: 'Could not access your location. Please allow location access.',
            variant: 'destructive'
          });
          setNearbyLoading(false);
        }
      );
    } else {
      toast({
        title: 'Not Supported',
        description: 'Geolocation is not supported by your browser',
        variant: 'destructive'
      });
    }
  };

  const filteredHostels = hostels.filter(hostel => {
    const matchesSearch = hostel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (hostel.locality && hostel.locality.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (hostel.city && hostel.city.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLocation = !locationFilter || 
                           (hostel.locality && hostel.locality.toLowerCase() === locationFilter.toLowerCase());
    
    const matchesGender = !genderFilter || 
                          (hostel.gender && hostel.gender === genderFilter);
    
    return matchesSearch && matchesLocation && matchesGender;
  });

  const renderPopularCities = () => {
    const popularCityList = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Chennai'];
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
        {popularCityList.map((city, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${cityFilter === city ? 'border-primary' : ''}`}
            onClick={() => handleCityChange(city)}
          >
            <CardContent className="p-4 text-center">
              <Hotel className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">{city}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="container mx-auto py-10 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Find Your Perfect Hostel</h1>
          <p className="text-muted-foreground">Browse available hostels and find the perfect accommodation</p>
        </div>

        {/* Popular Cities */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Popular Cities</h2>
          {renderPopularCities()}
        </div>

        {/* Search and filters */}
        <div className="mb-6 space-y-4 bg-muted/30 p-6 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                type="text" 
                placeholder="Search hostels by name or location..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Button
              onClick={handleFindNearby}
              variant="outline"
              className="md:w-auto"
              disabled={nearbyLoading}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {nearbyLoading ? 'Finding...' : 'Hostels Near Me'}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            {cityFilter && (
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">City:</span>
                <Badge className="flex items-center" variant="outline">
                  {cityFilter}
                  <button
                    onClick={() => {
                      setCityFilter('');
                      navigate('/hostels');
                      fetchHostels();
                    }}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              </div>
            )}
            
            {popularLocations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Locality:</span>
                {popularLocations.map((loc, index) => (
                  <Badge 
                    key={index}
                    variant={locationFilter === loc ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleLocationFilter(loc)}
                  >
                    {loc}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Gender:</span>
              <Badge 
                variant={genderFilter === 'Male' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleGenderFilter('Male')}
              >
                Male
              </Badge>
              <Badge 
                variant={genderFilter === 'Female' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleGenderFilter('Female')}
              >
                Female
              </Badge>
              <Badge 
                variant={genderFilter === 'Co-ed' ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleGenderFilter('Co-ed')}
              >
                Co-ed
              </Badge>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500">{error}</div>
        ) : filteredHostels.length === 0 ? (
          <div className="text-center py-10">
            {searchQuery || locationFilter || genderFilter || cityFilter 
              ? 'No hostels match your search criteria' 
              : 'No hostels available'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHostels.map((hostel) => (
              <Card key={hostel._id} className="overflow-hidden hover:shadow-md transition-shadow">
                {hostel.logoImage && (
                  <div className="w-full h-48 relative">
                    <AspectRatio ratio={16 / 9}>
                      <img 
                        src={import.meta.env.VITE_BASE_URL + hostel.logoImage}
                        alt={hostel.name}
                        className="object-cover w-full h-full"
                      />
                    </AspectRatio>
                    {hostel.gender && (
                      <Badge className="absolute top-2 right-2">
                        {hostel.gender === 'Male' ? 'Male Only' : 
                         hostel.gender === 'Female' ? 'Female Only' : 'Co-ed'}
                      </Badge>
                    )}
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{hostel.name}</CardTitle>
                  {hostel.locality && (
                    <div className="flex items-start text-sm">
                      <MapPin className="h-4 w-4 mr-1 mt-0.5 text-muted-foreground" />
                      <span>{hostel.area?.name}, {hostel.city?.name}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">                  
                  {hostel.stayType && (
                    <div className="flex items-center text-sm">
                      <span className="font-medium mr-2">Stay Type:</span>
                      <span>{hostel.stayType}</span>
                    </div>
                  )}
                  
                  {hostel.description && (
                    <p className="text-sm line-clamp-2 mt-2">{hostel.description}</p>
                  )}
                  
                  {hostel.amenities && hostel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {hostel.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {amenity.replace(/-/g, ' ')}
                        </Badge>
                      ))}
                      {hostel.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{hostel.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleViewRooms(hostel._id)} className="w-full">
                    View Rooms
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
