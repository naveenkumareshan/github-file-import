
import React, { useState, useEffect } from 'react';
import { CabinsHeader } from '../components/cabins/CabinsHeader';
import { CategoryFilter } from '../components/cabins/CategoryFilter';
import { CabinsGrid } from '../components/cabins/CabinsGrid';
import { cabinsService } from '../api/cabinsService';
import { reviewsService } from '../api/reviewsService';
import { toast } from '@/hooks/use-toast';
import { Cabin as FrontendCabin } from '../data/cabinsData';
import ErrorBoundary from '../components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Define backend Cabin type (Supabase schema)
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
  opening_time?: string;
  closing_time?: string;
  working_days?: string[];
  is_24_hours?: boolean;
  slots_enabled?: boolean;
}

const Cabins = () => {
  const [filter, setFilter] = useState<'all' | 'standard' | 'premium' | 'luxury'>('all');
  const [cabins, setCabins] = useState<FrontendCabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCabins = async () => {
      try {
        setLoading(true);
        setError(null);
        const filters = filter !== 'all' ? { category: filter } : {};
        const response = await cabinsService.getAllCabins(filters);
        
        if (response.success) {
          // Transform API cabins to match frontend model with required id property
          const transformedCabins = Array.isArray(response.data) ? response.data
            .filter((cabin: BackendCabin) => cabin.is_active !== false)
            .map((cabin: BackendCabin, index: number): FrontendCabin => ({
              id: String(index + 1),
              _id: cabin.id,
              name: cabin.name,
              description: cabin.description || '',
              price: cabin.price,
              capacity: cabin.capacity || 1,
              amenities: cabin.amenities || [],
              imageSrc: cabin.image_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
              imageUrl: cabin.image_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f',
              category: cabin.category || 'standard',
              isActive: cabin.is_active !== false,
              openingTime: cabin.opening_time || undefined,
              closingTime: cabin.closing_time || undefined,
              workingDays: cabin.working_days || undefined,
            } as any)) : [];
          
          // Fetch rating stats for all cabins
          const cabinIds = transformedCabins.map(c => c._id).filter(Boolean) as string[];
          if (cabinIds.length > 0) {
            try {
              const ratingStats = await reviewsService.getCabinRatingStatsBatch(cabinIds);
              transformedCabins.forEach(c => {
                const stats = ratingStats[c._id as string];
                if (stats) {
                  (c as any).averageRating = stats.average_rating;
                  (c as any).reviewCount = stats.review_count;
                }
              });
            } catch (e) {
              console.error('Error fetching rating stats:', e);
            }
          }

          setCabins(transformedCabins);
        } else {
          setError('Failed to load rooms');
          toast({
            title: "Error",
            description: "Failed to load cabins. Please try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching cabins:', error);
        setError('Failed to load rooms');
        toast({
          title: "Error",
          description: "Failed to load cabins. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCabins();
  }, [filter]);
    
  return (
    <div className="bg-background">
      
      {/* Hero Banner */}
      <section className="relative py-16 lg:py-20 bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-20 w-40 h-40 bg-brand-green/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-60 h-60 bg-brand-teal/20 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <CabinsHeader />
        </div>
        
        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L60 73.3C120 66.7 240 53.3 360 46.7C480 40 600 40 720 43.3C840 46.7 960 53.3 1080 56.7C1200 60 1320 60 1380 60L1440 60V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="hsl(200, 20%, 98%)"/>
          </svg>
        </div>
      </section>
      
      <div className="container mx-auto px-4 py-12">
        <CategoryFilter filter={filter} setFilter={setFilter} />
        <ErrorBoundary>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading reading rooms...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-destructive/10 text-destructive rounded-xl p-6 max-w-md mx-auto">
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-2">Please try refreshing the page.</p>
              </div>
            </div>
          ) : (
            <CabinsGrid cabins={cabins} />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Cabins;