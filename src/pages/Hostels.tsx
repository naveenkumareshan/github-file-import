
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import { Hotel, Utensils } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useSponsoredListings } from '@/hooks/useSponsoredListings';
import { MarketplaceHeader, FilterOption } from '@/components/marketplace/MarketplaceHeader';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { MarketplaceSkeleton } from '@/components/marketplace/MarketplaceSkeleton';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';

const genderFilters: FilterOption[] = [
  { id: 'all', label: 'All', icon: <Hotel className="h-3 w-3" /> },
  { id: 'Male', label: 'Male' },
  { id: 'Female', label: 'Female' },
  { id: 'Co-ed', label: 'Co-ed' },
];

const genderBadge: Record<string, string> = { Male: 'M', Female: 'F', 'Co-ed': 'Co' };

export default function Hostels() {
  const [hostels, setHostels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const dominantCityId = React.useMemo(() => {
    const cityCount: Record<string, number> = {};
    hostels.forEach(h => { if (h.city_id) cityCount[h.city_id] = (cityCount[h.city_id] || 0) + 1; });
    return Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [hostels]);

  const { mergeListings, trackImpression, trackClick } = useSponsoredListings({
    propertyType: 'hostel',
    cityId: dominantCityId,
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await hostelService.getAllHostels();
        setHostels(data || []);
      } catch {
        setError('No hostels available at the moment.');
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = hostels.filter(h => {
    const matchesGender = genderFilter === 'all' || h.gender === genderFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || h.name?.toLowerCase().includes(q) || h.areas?.name?.toLowerCase().includes(q) || h.cities?.name?.toLowerCase().includes(q);
    return matchesGender && matchesSearch;
  });

  const displayHostels = mergeListings(filtered);

  const getPrice = (h: any): string | undefined => {
    if (h.starting_price > 0) return formatCurrency(h.starting_price);
    const prices = h.hostel_rooms?.flatMap((r: any) => r.hostel_sharing_options?.map((o: any) => o.price_monthly) || []).filter((p: number) => p > 0) || [];
    return prices.length > 0 ? formatCurrency(Math.min(...prices)) : undefined;
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader
        title="Hostels"
        searchPlaceholder="Search hostels..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={genderFilters}
        activeFilter={genderFilter}
        onFilterChange={setGenderFilter}
      />

      <div className="px-3 py-3 max-w-lg lg:max-w-5xl mx-auto">
        {loading ? (
          <MarketplaceSkeleton />
        ) : error && hostels.length === 0 ? (
          <MarketplaceEmpty
            icon={<Hotel className="h-8 w-8 text-muted-foreground" />}
            title="No Hostels Available"
            subtitle="Check back later for new listings."
          />
        ) : displayHostels.length === 0 ? (
          <MarketplaceEmpty
            icon={<Hotel className="h-8 w-8 text-muted-foreground" />}
            title="No hostels found"
            subtitle={genderFilter !== 'all' ? 'Try adjusting your filter.' : 'No hostels available.'}
          />
        ) : (
          <>
            <p className="text-[11px] text-muted-foreground mb-2.5">{displayHostels.length} hostels found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayHostels.map((h: any, idx: number) => {
                const price = getPrice(h);
                return (
                  <MarketplaceCard
                    key={`${h.id}-${idx}`}
                    image={h.logo_image}
                    fallbackIcon={<Hotel className="h-8 w-8" />}
                    name={h.name}
                    location={[h.areas?.name, h.cities?.name].filter(Boolean).join(', ')}
                    rating={h.average_rating}
                    reviewCount={h.review_count}
                    tags={h.amenities?.slice(0, 5).map((a: string) => a.replace(/-/g, ' '))}
                    price={price ? `From ${price}` : undefined}
                    priceLabel="/mo"
                    badge={genderBadge[h.gender] || undefined}
                    badgeVariant="secondary"
                    ctaLabel="View Rooms"
                    sponsoredTier={h.sponsoredTier || null}
                    sponsoredRef={h.sponsoredListingId ? (el: HTMLDivElement | null) => {
                      if (el) {
                        const observer = new IntersectionObserver(([entry]) => {
                          if (entry.isIntersecting) { trackImpression(h.sponsoredListingId!); observer.disconnect(); }
                        }, { threshold: 0.5 });
                        observer.observe(el);
                      }
                    } : undefined}
                    onClick={() => {
                      if (h.sponsoredListingId) trackClick(h.sponsoredListingId);
                      navigate(`/hostels/${h.serial_number || h.id}`);
                    }}
                    extraContent={
                      h.food_enabled ? (
                        <span className="flex items-center gap-0.5 text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                          <Utensils className="h-3 w-3" /> Food
                        </span>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
