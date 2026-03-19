
import React from 'react';
import { getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { MarketplaceSkeleton } from '@/components/marketplace/MarketplaceSkeleton';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';

interface CabinResult {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  imageSrc?: string;
  image_url?: string;
  category: 'standard' | 'premium' | 'luxury';
  city?: string;
  area?: string;
  location?: {
    coordinates?: { latitude: number; longitude: number };
    fullAddress?: string;
    city?: { _id: string; name: string };
    state?: { _id: string; name: string };
    area?: { _id: string; name: string };
  };
  averageRating?: number;
  reviewCount?: number;
  distance?: number;
}

interface CabinSearchResultsProps {
  cabins: (CabinResult & { sponsoredTier?: string; sponsoredListingId?: string })[];
  loading?: boolean;
  hasMore?: boolean;
  currentPage?: number;
  totalPages?: number;
  limit?: number;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onTrackImpression?: (listingId: string) => void;
  onTrackClick?: (listingId: string) => void;
}

const getCategoryBadgeVariant = (category: string): 'amber' | 'purple' | 'primary' => {
  switch (category) {
    case 'luxury': return 'amber';
    case 'premium': return 'purple';
    default: return 'primary';
  }
};

export const CabinSearchResults = ({
  cabins,
  loading,
  hasMore = false,
  currentPage = 1,
  totalPages = 1,
  limit = 10,
  onLoadMore,
  loadingMore = false,
  onTrackImpression,
  onTrackClick,
}: CabinSearchResultsProps) => {

  const navigate = useNavigate();

  if (loading) {
    return <MarketplaceSkeleton count={5} />;
  }

  if (cabins.length === 0) {
    return (
      <MarketplaceEmpty
        title="No reading rooms found"
        subtitle="Try adjusting your filters or location."
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-muted-foreground">{cabins.length} rooms found</p>

      <div className="space-y-2.5">
        {cabins.map((cabin, idx) => {
          const cabinId = cabin.id || cabin._id;
          const cabinSlug = (cabin as any).serial_number || cabinId;
          const imgSrc = cabin.imageSrc || cabin.image_url || '/placeholder.svg';
          const locationStr = [
            cabin.location?.area?.name || cabin.area,
            cabin.location?.city?.name || cabin.city,
          ].filter(Boolean).join(', ');

          return (
            <MarketplaceCard
              key={`${cabinId}-${idx}`}
              image={getImageUrl(imgSrc) || '/placeholder.svg'}
              name={cabin.name}
              location={locationStr}
              rating={cabin.averageRating}
              reviewCount={cabin.reviewCount}
              tags={cabin.amenities}
              price={`₹${cabin.price}`}
              priceLabel="/mo"
              badge={cabin.category.charAt(0).toUpperCase() + cabin.category.slice(1)}
              badgeVariant={getCategoryBadgeVariant(cabin.category)}
              ctaLabel="Book"
              sponsoredTier={cabin.sponsoredTier as any}
              sponsoredRef={cabin.sponsoredListingId ? (el: HTMLDivElement | null) => {
                if (el && onTrackImpression) {
                  const observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) { onTrackImpression(cabin.sponsoredListingId!); observer.disconnect(); }
                  }, { threshold: 0.5 });
                  observer.observe(el);
                }
              } : undefined}
              onClick={() => {
                if (cabin.sponsoredListingId && onTrackClick) onTrackClick(cabin.sponsoredListingId);
                navigate(`/book-seat/${cabinSlug}`);
              }}
              extraContent={cabin.distance ? (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {cabin.distance.toFixed(1)}km away
                </span>
              ) : undefined}
            />
          );
        })}
      </div>

      {/* Load More */}
      {(hasMore || currentPage < totalPages) && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-[11px] text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          {onLoadMore && hasMore && (
            <Button
              onClick={onLoadMore}
              disabled={loadingMore}
              variant="outline"
              size="sm"
              className="rounded-xl text-[13px] min-w-28"
            >
              {loadingMore ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading...</>
              ) : 'Load More'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
