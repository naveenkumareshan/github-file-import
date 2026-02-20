
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { LocationSearch } from '@/components/search/LocationSearch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, List } from 'lucide-react';
import { cabinsService } from '@/api/cabinsService';
import { toast } from '@/hooks/use-toast';
const CabinMapView = lazy(() =>
  import("@/components/search/CabinMapView").then((m) => ({
    default: m.CabinMapView,
  }))
);
const CabinSearchResults = lazy(() =>
  import("@/components/search/CabinSearchResults").then((m) => ({
    default: m.CabinSearchResults,
  }))
);


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

interface CabinResult {
  _id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  imageUrl: string;
  imageSrc:string;
  category: 'standard' | 'premium' | 'luxury';
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    fullAddress: string;
    city: { _id:string, name:string};
    state: { _id:string, name:string};
    area?: { _id:string, name:string};
  };
  averageRating?: number;
  distance?: number;
}

const CabinSearch = () => {
  const [searchResults, setSearchResults] = useState<CabinResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters | null>(null);
  const [limit, setLimit] = useState(10);

  

  const handleSearch = async (filters: SearchFilters, page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      // Build search parameters
      const searchParams: any = {
        search: filters.query,
        category: filters.category || undefined,
        minPrice: filters.priceRange.min > 0 ? filters.priceRange.min : undefined,
        maxPrice: filters.priceRange.max < 10000 ? filters.priceRange.max : undefined,
        amenities: filters.amenities.length > 0 ? filters.amenities.join(',') : undefined,
        sortBy: filters.sortBy,
        state: filters.stateId || undefined,
        city: filters.cityId || undefined,
        area: filters.areaId || undefined,
        radius: filters.radius || undefined,
        page: page,
        limit: limit
      };

      // Add location-based search if available
      // if (filters.userLocation) {
      //   searchParams.lat = filters.userLocation.lat;
      //   searchParams.lng = filters.userLocation.lng;
      // }

      const response = await cabinsService.getAllCabins(searchParams);
      
      if (response.success) {
        const newResults = response.data || [];
        
        if (append) {
          setSearchResults(prev => [...prev, ...newResults]);
        } else {
          setSearchResults(newResults);
        }
        
        setTotalPages(response.totalPages || 1);
        setHasMore((response.totalPages || 1) > page);
        setCurrentPage(page);
        setLastSearchFilters(filters);
        
        if (newResults.length === 0 && !append) {
          toast({
            title: "No Results",
            description: "No reading rooms found matching your search criteria.",
          });
        }
      } else {
        throw new Error('Failed to search cabins');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search reading rooms. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (lastSearchFilters && hasMore && !loadingMore) {
      handleSearch(lastSearchFilters, currentPage + 1, true);
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number }) => {
    // setSelectedLocation(location);
  };

  // Initial load of all cabins
  useEffect(() => {
    const loadInitialCabins = async () => {
      try {
        setLoading(true);
        const response = await cabinsService.getAllCabins({ page: 1, limit: limit });
        if (response.success) {
          setSearchResults(response.data || []);
          setTotalPages(response.totalPages || 1);
          setHasMore((response.totalPages || 1) > 1);
        }
      } catch (error) {
        console.error('Error loading initial cabins:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialCabins();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Reading Rooms</h1>
          <p className="text-muted-foreground">
            Search and filter reading rooms by location, price, and amenities
          </p>
        </div>

        {/* Search Component */}
        <div className="mb-8">
          <LocationSearch 
            onSearch={handleSearch}
            onLocationSelect={handleLocationSelect}
            loading={loading}
          />
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'list' | 'map')}>
            {/* <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                Map View
              </TabsTrigger>
            </TabsList> */}
          </Tabs>
        </div>

        {/* Results */}
        <div className="mb-8">
          {activeView === 'list' ? (
            <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading results...</div>}>
              <CabinSearchResults 
                cabins={searchResults}
                loading={loading}
                limit={limit}
                hasMore={hasMore}
                currentPage={currentPage}
                totalPages={totalPages}
                onLoadMore={handleLoadMore}
                loadingMore={loadingMore}
              />
            </Suspense>
          ) : (
           <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading map...</div>}>
            <CabinMapView 
              cabins={searchResults}
              selectedLocation={selectedLocation}
              loading={loading}
            />
          </Suspense>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CabinSearch;
