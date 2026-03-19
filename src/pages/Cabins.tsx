
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cabinsService } from '../api/cabinsService';
import { reviewsService } from '../api/reviewsService';
import { toast } from '@/hooks/use-toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { BookOpen } from 'lucide-react';
import { MarketplaceHeader, FilterOption } from '@/components/marketplace/MarketplaceHeader';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { MarketplaceSkeleton } from '@/components/marketplace/MarketplaceSkeleton';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';

interface BackendCabin {
  id: string;
  name: string;
  description: string;
  price: number;
  capacity?: number;
  amenities?: string[];
  image_url?: string;
  category: 'standard' | 'premium' | 'luxury';
  is_active: boolean;
  serial_number?: string;
  city?: string;
  area?: string;
}

const filters: FilterOption[] = [
  { id: 'all', label: 'All Rooms', icon: <BookOpen className="h-3 w-3" /> },
  { id: 'standard', label: 'Standard' },
  { id: 'premium', label: 'Premium' },
  { id: 'luxury', label: 'Luxury' },
];

const categoryBadge: Record<string, { label: string; variant: 'primary' | 'purple' | 'amber' }> = {
  standard: { label: 'STD', variant: 'primary' },
  premium: { label: 'PRE', variant: 'purple' },
  luxury: { label: 'LUX', variant: 'amber' },
};

const Cabins = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [cabins, setCabins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  useEffect(() => {
    const fetchCabins = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: any = {};
        if (filter !== 'all') params.category = filter;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const response = await cabinsService.getAllCabins(params);

        if (response.success) {
          const transformed = (Array.isArray(response.data) ? response.data : [])
            .filter((c: BackendCabin) => c.is_active !== false)
            .map((c: BackendCabin) => ({
              _id: c.id,
              name: c.name,
              description: c.description || '',
              price: c.price,
              capacity: c.capacity || 1,
              amenities: c.amenities || [],
              image_url: c.image_url,
              category: c.category || 'standard',
              serial_number: c.serial_number,
              city: c.city,
              area: c.area,
            }));

          const cabinIds = transformed.map((c: any) => c._id).filter(Boolean);
          if (cabinIds.length > 0) {
            try {
              const ratingStats = await reviewsService.getCabinRatingStatsBatch(cabinIds);
              transformed.forEach((c: any) => {
                const stats = ratingStats[c._id];
                if (stats) {
                  c.averageRating = stats.average_rating;
                  c.reviewCount = stats.review_count;
                }
              });
            } catch (e) {
              console.error('Error fetching rating stats:', e);
            }
          }
          setCabins(transformed);
        } else {
          setError('Failed to load rooms');
          toast({ title: 'Error', description: 'Failed to load cabins.', variant: 'destructive' });
        }
      } catch {
        setError('Failed to load rooms');
        toast({ title: 'Error', description: 'Failed to load cabins.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchCabins();
  }, [filter, debouncedSearch]);

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader
        title="Study Rooms"
        searchPlaceholder="Search rooms..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <div className="px-3 py-3 max-w-lg lg:max-w-5xl mx-auto">
        <ErrorBoundary>
          {loading ? (
            <MarketplaceSkeleton />
          ) : error || cabins.length === 0 ? (
            <MarketplaceEmpty
              icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
              title="No reading rooms found"
              subtitle="Try selecting a different category or search term."
            />
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground mb-2.5">
                {cabins.length} room{cabins.length !== 1 ? 's' : ''} found
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cabins.map((c: any) => {
                  const b = categoryBadge[c.category] || categoryBadge.standard;
                  return (
                    <MarketplaceCard
                      key={c._id}
                      image={c.image_url}
                      fallbackIcon={<BookOpen className="h-8 w-8" />}
                      name={c.name}
                      location={[c.area, c.city].filter(Boolean).join(', ')}
                      rating={c.averageRating}
                      reviewCount={c.reviewCount}
                      tags={c.amenities?.map((a: string) => a.replace(/-/g, ' '))}
                      price={c.price ? `₹${c.price}` : undefined}
                      priceLabel="/mo"
                      badge={b.label}
                      badgeVariant={b.variant}
                      ctaLabel="Book Now"
                      onClick={() => navigate(`/book-seat/${c.serial_number || c._id}`)}
                    />
                  );
                })}
              </div>
            </>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Cabins;
