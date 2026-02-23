
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { Search, MapPin, Hotel } from 'lucide-react';
import { getImageUrl } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function Hostels() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
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
    } catch (err: any) {
      setError('No hostels available at the moment.');
      console.error('Error fetching hostels:', err);
    } finally { setLoading(false); }
  };

  const handleCityChange = (city: string) => {
    setCityFilter(city === cityFilter ? '' : city);
    if (city === cityFilter) { navigate('/hostels'); fetchHostels(''); }
    else { navigate(`/hostels?city=${city}`); fetchHostels(city); }
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
          setLocationFilter(''); setCityFilter('');
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
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-3 pt-3 pb-2 max-w-lg mx-auto">
          <h1 className="text-[16px] font-semibold mb-2">Find Your Hostel</h1>

          {/* Search bar */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
            <Input
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-[13px] rounded-xl"
            />
          </div>

          {/* Filters row */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Button onClick={handleFindNearby} variant="outline" size="sm" disabled={nearbyLoading} className="h-8 text-[11px] rounded-xl flex-shrink-0">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              {nearbyLoading ? 'Finding...' : 'Near Me'}
            </Button>
            {['Male', 'Female', 'Co-ed'].map(g => (
              <button
                key={g}
                onClick={() => setGenderFilter(genderFilter === g ? '' : g)}
                className={`flex-shrink-0 px-3 py-1 rounded-xl text-[11px] font-medium border transition-colors h-8 ${
                  genderFilter === g
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border'
                }`}
              >
                {g}
              </button>
            ))}
            {popularCityList.map((city) => (
              <button
                key={city}
                onClick={() => handleCityChange(city)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-xl border text-[11px] font-medium transition-colors h-8 ${
                  cityFilter === city
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-foreground border-border hover:bg-muted'
                }`}
              >
                <Hotel className="h-3 w-3" />
                {city}
              </button>
            ))}
          </div>

          {cityFilter && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] text-muted-foreground">City:</span>
              <Badge variant="outline" className="text-[11px] flex items-center gap-1">
                {cityFilter}
                <button onClick={() => { setCityFilter(''); navigate('/hostels'); fetchHostels(); }}>×</button>
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-3 py-3 max-w-lg mx-auto">
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3 bg-card rounded-2xl border border-border animate-pulse">
                <div className="w-20 h-20 rounded-xl bg-muted flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2.5 bg-muted rounded w-1/2" />
                  <div className="h-2.5 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[14px] font-medium text-foreground mb-1">No Hostels Available</p>
            <p className="text-[12px] text-muted-foreground">Unable to fetch data. Please refresh.</p>
          </div>
        ) : filteredHostels.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[14px] font-medium text-foreground mb-1">No hostels found</p>
            <p className="text-[12px] text-muted-foreground">
              {searchQuery || locationFilter || genderFilter || cityFilter ? 'Try adjusting your search' : 'No hostels available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-[11px] text-muted-foreground">{filteredHostels.length} hostels found</p>
            {filteredHostels.map((hostel) => (
              <div
                key={hostel._id}
                onClick={() => navigate(`/hostels/${hostel._id}`)}
                className="flex gap-3 p-3 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
                  {hostel.logoImage ? (
                    <img
                      src={getImageUrl(hostel.logoImage)}
                      alt={hostel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Hotel className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  {hostel.gender && (
                    <span className="absolute top-1 left-1 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md">
                      {hostel.gender === 'Male' ? 'M' : hostel.gender === 'Female' ? 'F' : 'Co'}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[13px] font-semibold text-foreground leading-tight truncate">{hostel.name}</h3>
                    {(hostel.area?.name || hostel.city?.name) && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-[11px] text-muted-foreground truncate">
                          {hostel.area?.name ? hostel.area.name + ', ' : ''}{hostel.city?.name}
                        </span>
                      </div>
                    )}
                    {hostel.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {hostel.amenities.slice(0, 3).map((a: string, i: number) => (
                          <span key={i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                            {a.replace(/-/g, ' ')}
                          </span>
                        ))}
                        {hostel.amenities.length > 3 && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">+{hostel.amenities.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    {hostel.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 flex-1 mr-2">{hostel.description}</p>
                    )}
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg flex-shrink-0">View Rooms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
