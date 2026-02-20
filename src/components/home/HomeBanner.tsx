import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  display_order: number;
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'default-1',
    title: 'Your Perfect Study Space',
    subtitle: 'Book premium reading rooms designed for focused study',
    image_url: '',
    link_url: '/cabins',
    display_order: 0,
  },
];

export const HomeBanner: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>(DEFAULT_BANNERS);
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (data && data.length > 0) setBanners(data as Banner[]);
    })();
  }, []);

  const next = useCallback(() => setCurrent((c) => (c + 1) % banners.length), [banners.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + banners.length) % banners.length), [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(next, 4000);
    return () => clearInterval(t);
  }, [banners.length, next]);

  const banner = banners[current];

  return (
    <div className="relative rounded-2xl overflow-hidden mx-0 mb-4 select-none">
      <div
        className="relative h-36 cursor-pointer"
        onClick={() => banner.link_url && navigate(banner.link_url)}
      >
        {banner.image_url ? (
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary via-primary/80 to-secondary/70 flex flex-col justify-end p-4">
            <p className="text-primary-foreground font-bold text-[15px] leading-tight">{banner.title}</p>
            {banner.subtitle && (
              <p className="text-primary-foreground/80 text-[11px] mt-0.5">{banner.subtitle}</p>
            )}
          </div>
        )}
        {banner.image_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <p className="text-white font-bold text-[15px] leading-tight">{banner.title}</p>
            {banner.subtitle && (
              <p className="text-white/80 text-[11px] mt-0.5">{banner.subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Prev/Next */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`h-1.5 rounded-full transition-all ${
                  i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HomeBanner;
