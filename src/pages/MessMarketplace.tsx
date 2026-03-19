import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMessPartners } from '@/api/messService';
import { getImageUrl } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { UtensilsCrossed } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MarketplaceHeader, FilterOption } from '@/components/marketplace/MarketplaceHeader';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { MarketplaceSkeleton } from '@/components/marketplace/MarketplaceSkeleton';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';

const FOOD_LABELS: Record<string, string> = { veg: '🟢 Veg', non_veg: '🔴 Non-Veg', both: '🟡 Both' };
const FOOD_BADGE: Record<string, { label: string; variant: 'green' | 'destructive' | 'amber' }> = {
  veg: { label: 'VEG', variant: 'green' },
  non_veg: { label: 'NON', variant: 'destructive' },
  both: { label: 'MIX', variant: 'amber' },
};

const filters: FilterOption[] = [
  { id: 'all', label: 'All', icon: <UtensilsCrossed className="h-3 w-3" /> },
  { id: 'veg', label: '🟢 Veg' },
  { id: 'non_veg', label: '🔴 Non-Veg' },
  { id: 'both', label: '🟡 Both' },
];

export default function MessMarketplace() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [messes, setMesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getMessPartners({ approved: true, active: true });
        setMesses(data);
      } catch {
        toast({ title: 'Failed to load mess partners', variant: 'destructive' });
      }
      setLoading(false);
    })();
  }, []);

  const filtered = messes.filter(m => {
    const matchesType = filter === 'all' || m.food_type === filter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || m.name?.toLowerCase().includes(q) || m.location?.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader
        title="Food / Mess"
        searchPlaceholder="Search mess..."
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
          ) : filtered.length === 0 ? (
            <MarketplaceEmpty
              icon={<UtensilsCrossed className="h-8 w-8 text-muted-foreground" />}
              title="No mess partners found"
              subtitle="Try selecting a different category."
            />
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground mb-2.5">
                {filtered.length} mess{filtered.length !== 1 ? 'es' : ''} found
              </p>
              <div className="space-y-2.5">
                {filtered.map((m: any) => {
                  const mainImage = m.logo_image || (m.images && m.images[0]) || '/placeholder.svg';
                  const fb = FOOD_BADGE[m.food_type];
                  return (
                    <MarketplaceCard
                      key={m.id}
                      image={getImageUrl(mainImage)}
                      fallbackIcon={<UtensilsCrossed className="h-8 w-8" />}
                      name={m.name}
                      location={m.location}
                      tags={[FOOD_LABELS[m.food_type] || m.food_type].filter(Boolean)}
                      price={m.starting_price ? `From ₹${m.starting_price}` : undefined}
                      badge={fb?.label}
                      badgeVariant={fb?.variant || 'primary'}
                      ctaLabel="View Menu"
                      onClick={() => navigate(`/mess/${m.serial_number || m.id}`)}
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
}
