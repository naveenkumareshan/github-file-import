
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { Search, MapPin, Hotel } from 'lucide-react';
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
  const [genderFilter, setGenderFilter] = useState('');
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const cityParam = queryParams.get('city');
    if (cityParam) setCityFilter(cityParam);
    fetchHostels(cityParam || '');
  }, [location.search]);

  const fetchHostels = async (city: string = '') => {
    try {
      setLoading(true);
      const filters = city ? { city } : {};
      const response = await hostelService.getAllHostels(filters);
      setHostels(response.data || []);
      if (response.data?.length > 0) {
        const locs = response.data.map((h: any) => h.locality)
          .filter((l: string, i: number, s: string[]) => l && s.indexOf(l) === i);
        setPopularLocations(locs.slice(0, 5));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch hostels');
      toast({ title: 'Error', description: 'Failed to load hostels', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleCityChange = (city: string) => {
    setCityFilter(city);
    navigate(`/hostels?city=${city}`);
    fetchHostels(city);
  };

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Not Supported', description: 'Geolocation is not supported by your browser', variant: 'destructive' });
      return;
    }
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const response = await hostelService.getNearbyHostels(latitude, longitude);
          setHostels(response.data || []);
          setLocationFilter('');
          setCityFilter('');
          toast({ title: 'Location Found', description: 'Showing hostels near you' });
        } catch {
          toast({ title: 'Error', description: 'Failed to find nearby hostels', variant: 'destructive' });
        } finally { setNearbyLoading(false); }
      },
      () => {
        toast({ title: 'Location Error', description: 'Could not access your location.', variant: 'destructive' });
        setNearbyLoading(false);
      }
    );
  };

  const filteredHostels = hostels.filter(hostel => {
    const matchesSearch = hostel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (hostel.locality && hostel.locality.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (hostel.city && hostel.city.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLocation = !locationFilter || (hostel.locality && hostel.locality.toLowerCase() === locationFilter.toLowerCase());
    const matchesGender = !genderFilter || (hostel.gender && hostel.gender === genderFilter);
    return matchesSearch && matchesLocation && matchesGender;
  });

  const popularCityList = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Pune', 'Chennai'];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-5">
          <h1 className="text-2xl font-bold mb-1">Find Your Perfect Hostel</h1>
          <p className="text-muted-foreground text-sm">Browse available hostels and find the perfect accommodation</p>
        </div>

        {/* Popular Cities — horizontal scroll */}
        <div className="mb-5">
          <h2 className="text-base font-semibold mb-3">Popular Cities</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
            {popularCityList.map((city) => (
              <button
                key={city}
                onClick={() => handleCityChange(city)}
                className={`flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border text-sm font-medium transition-colors ${
                  cityFilter === city
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                <Hotel className="h-5 w-5" />
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-5 space-y-3 bg-muted/30 p-4 rounded-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search hostels by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={handleFindNearby} variant="outline" size="sm" disabled={nearbyLoading} className="rounded-xl">
              <MapPin className="h-4 w-4 mr-1" />
              {nearbyLoading ? 'Finding...' : 'Near Me'}
            </Button>
            {['Male', 'Female', 'Co-ed'].map(g => (
              <Badge
                key={g}
                variant={genderFilter === g ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setGenderFilter(genderFilter === g ? '' : g)}
              >
                {g}
              </Badge>
            ))}
          </div>

          {cityFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">City:</span>
              <Badge variant="outline" className="flex items-center gap-1">
                {cityFilter}
                <button onClick={() => { setCityFilter(''); navigate('/hostels'); fetchHostels(); }}>×</button>
              </Badge>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-destructive">{error}</div>
        ) : filteredHostels.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            {searchQuery || locationFilter || genderFilter || cityFilter ? 'No hostels match your search' : 'No hostels available'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHostels.map((hostel) => (
              <Card key={hostel._id} className="overflow-hidden hover:shadow-md transition-shadow rounded-2xl">
                {hostel.logoImage && (
                  <AspectRatio ratio={16 / 9} className="relative">
                    <img
                      src={import.meta.env.VITE_BASE_URL + hostel.logoImage}
                      alt={hostel.name}
                      className="object-cover w-full h-full"
                    />
                    {hostel.gender && (
                      <Badge className="absolute top-2 right-2">
                        {hostel.gender === 'Male' ? 'Male Only' : hostel.gender === 'Female' ? 'Female Only' : 'Co-ed'}
                      </Badge>
                    )}
                  </AspectRatio>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{hostel.name}</CardTitle>
                  {hostel.locality && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      <span>{hostel.area?.name}, {hostel.city?.name}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pb-2 space-y-1">
                  {hostel.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{hostel.description}</p>
                  )}
                  {hostel.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hostel.amenities.slice(0, 3).map((a: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{a.replace(/-/g, ' ')}</Badge>
                      ))}
                      {hostel.amenities.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">+{hostel.amenities.length - 3}</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={() => navigate(`/hostels/${hostel._id}`)} className="w-full rounded-xl">
                    View Rooms
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
