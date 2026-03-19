import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { laundryCloudService } from '@/api/laundryCloudService';
import { toast } from '@/hooks/use-toast';
import { Shirt, Truck, Clock } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MarketplaceHeader, FilterOption } from '@/components/marketplace/MarketplaceHeader';
import { MarketplaceCard } from '@/components/marketplace/MarketplaceCard';
import { MarketplaceSkeleton } from '@/components/marketplace/MarketplaceSkeleton';
import { MarketplaceEmpty } from '@/components/marketplace/MarketplaceEmpty';

export default function Laundry() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState('all');

  useEffect(() => {
    (async () => {
      try {
        const data = await laundryCloudService.getActivePartners();
        setPartners(data || []);
      } catch {
        toast({ title: 'Failed to load laundry services', variant: 'destructive' });
      }
      setLoading(false);
    })();
  }, []);

  const areas: FilterOption[] = [
    { id: 'all', label: 'All', icon: <Shirt className="h-3 w-3" /> },
    ...Array.from(new Set(partners.map(p => p.service_area).filter(Boolean))).map(a => ({ id: a, label: a })),
  ];

  const filtered = partners.filter(p => {
    const matchesArea = areaFilter === 'all' || p.service_area === areaFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || p.business_name?.toLowerCase().includes(q) || p.service_area?.toLowerCase().includes(q);
    return matchesArea && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader
        title="Laundry Services"
        searchPlaceholder="Search laundry..."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={areas}
        activeFilter={areaFilter}
        onFilterChange={setAreaFilter}
      />

      <div className="px-3 py-3 max-w-lg lg:max-w-5xl mx-auto">
        <ErrorBoundary>
          {loading ? (
            <MarketplaceSkeleton />
          ) : filtered.length === 0 ? (
            <MarketplaceEmpty
              icon={<Shirt className="h-8 w-8 text-muted-foreground" />}
              title="No laundry services found"
              subtitle="Try a different search or area."
            />
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground mb-2.5">
                {filtered.length} service{filtered.length !== 1 ? 's' : ''} found
              </p>
              <div className="space-y-2.5">
                {filtered.map((p: any) => {
                  const mainImage = p.images?.[0] || null;
                  const tags: string[] = [];
                  if (p.delivery_time_hours) tags.push(`🚚 ${p.delivery_time_hours}h delivery`);
                  if (p.operating_hours) tags.push(`🕐 ${(p.operating_hours as any)?.start}-${(p.operating_hours as any)?.end}`);

                  return (
                    <MarketplaceCard
                      key={p.id}
                      image={mainImage}
                      fallbackIcon={<Shirt className="h-8 w-8" />}
                      name={p.business_name}
                      location={p.service_area}
                      tags={tags}
                      ctaLabel="View"
                      onClick={() => navigate(`/laundry/${p.serial_number || p.id}`)}
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
