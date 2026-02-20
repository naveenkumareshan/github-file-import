
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Users, Clock, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface CabinResult {
  _id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  imageSrc: string;
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

interface CabinSearchResultsProps {
  cabins: CabinResult[];
  loading?: boolean;
  hasMore?: boolean;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  onLoadMore?: () => void;
  loadingMore?: boolean;
}

export const CabinSearchResults = ({ 
  cabins, 
  loading, 
  hasMore = false,
  currentPage = 1,
  totalPages = 1,
  limit=10,
  onLoadMore,
  loadingMore = false
}: CabinSearchResultsProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted"></div>
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
              <div className="h-3 bg-muted rounded mb-2 w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (cabins.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-muted-foreground">No reading rooms found matching your criteria.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your search filters or location.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'luxury': return 'bg-amber-500';
      case 'premium': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const handleBookNow = (cabinId: string) => {
    navigate(`/book-seat/${cabinId}`);
  };


  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cabins.map((cabin) => (
        <Link to={`/book-seat/${cabin._id}`} key={'link'+cabin._id} >
        <Card key={cabin._id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="relative h-48 overflow-hidden">
            <img 
              src={ cabin.imageSrc ? import.meta.env.VITE_BASE_URL + cabin.imageSrc : '/placeholder.svg'} 
              alt={cabin.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2">
              <Badge className={getCategoryColor(cabin.category)}>
                {cabin.category.charAt(0).toUpperCase() + cabin.category.slice(1)}
              </Badge>
            </div>
            {cabin.distance && (
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-white/90">
                  {cabin.distance.toFixed(1)} km
                </Badge>
              </div>
            )}
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{cabin.name}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{cabin.location?.area ? cabin.location?.area?.name + ", " :''}{cabin.location?.city?.name}</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {cabin.description}
            </p>

            <div className="flex items-center justify-between text-sm">
              {/* <div className="flex items-center">
                <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>Capacity: {cabin.capacity}</span>
              </div> */}
              {cabin.averageRating > 0 && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500 fill-current" />
                  <span>{cabin.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="text-lg font-semibold text-primary">
              ₹{cabin.price}/month
            </div>
            {cabin.amenities && cabin.amenities.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cabin.amenities.slice(0, 3).map((amenity, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
                {cabin.amenities.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{cabin.amenities.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button 
              size="sm" 
              onClick={() => handleBookNow(cabin._id)}
              className="flex-1"
            >
              Book Now
            </Button>
          </CardFooter>
        </Card>
        </Link>
      ))}
    </div>
          {/* Pagination Controls */}
      {(hasMore || currentPage < totalPages) && (
        <div className="flex flex-col items-center space-y-4 mt-8">
          <div className="text-sm text-muted-foreground">
            Showing {cabins.length} of {totalPages * limit} results (Page {currentPage} of {totalPages})
          </div>
          
          {onLoadMore && hasMore && (
            <Button 
              onClick={onLoadMore}
              disabled={loadingMore}
              variant="outline"
              size="lg"
              className="min-w-32"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
