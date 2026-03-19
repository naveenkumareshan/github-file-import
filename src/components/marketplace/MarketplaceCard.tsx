import React from 'react';
import { MapPin, Star, Heart, Phone, Navigation } from 'lucide-react';

export interface MarketplaceCardProps {
  image?: string | null;
  fallbackIcon?: React.ReactNode;
  name: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  price?: string;
  priceLabel?: string;
  availability?: string;
  badge?: string;
  badgeVariant?: 'primary' | 'secondary' | 'amber' | 'green' | 'purple' | 'destructive';
  ctaLabel?: string;
  onClick?: () => void;
  onSave?: (e: React.MouseEvent) => void;
  onCall?: (e: React.MouseEvent) => void;
  onMap?: (e: React.MouseEvent) => void;
  sponsoredTier?: 'featured' | 'inline_sponsored' | null;
  sponsoredRef?: React.Ref<HTMLDivElement>;
  extraContent?: React.ReactNode;
}

const badgeColors: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  amber: 'bg-amber-500 text-white',
  green: 'bg-emerald-500 text-white',
  purple: 'bg-purple-500 text-white',
  destructive: 'bg-destructive text-destructive-foreground',
};

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({
  image,
  fallbackIcon,
  name,
  location,
  rating,
  reviewCount,
  tags,
  price,
  priceLabel,
  availability,
  badge,
  badgeVariant = 'primary',
  ctaLabel = 'View',
  onClick,
  onSave,
  onCall,
  onMap,
  sponsoredTier,
  sponsoredRef,
  extraContent,
}) => {
  const borderClass =
    sponsoredTier === 'featured'
      ? 'border-amber-300 bg-amber-50/30 dark:bg-amber-950/20'
      : sponsoredTier === 'inline_sponsored'
      ? 'border-blue-300 bg-blue-50/20 dark:bg-blue-950/20'
      : 'border-border hover:border-primary/30';

  return (
    <div
      ref={sponsoredRef}
      onClick={onClick}
      className={`relative flex gap-3.5 p-3 bg-card rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99] cursor-pointer group ${borderClass}`}
    >
      {/* Sponsored badge */}
      {sponsoredTier === 'featured' && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-md z-10">
          Featured
        </span>
      )}
      {sponsoredTier === 'inline_sponsored' && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-md z-10">
          Sponsored
        </span>
      )}

      {/* Image */}
      <div className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {fallbackIcon}
          </div>
        )}
        {badge && (
          <span
            className={`absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase leading-none ${badgeColors[badgeVariant]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          {/* Title row + quick actions */}
          <div className="flex items-start justify-between gap-1">
            <h3 className="text-[13px] font-semibold text-foreground leading-tight truncate">
              {name}
            </h3>
            {!sponsoredTier && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {onSave && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onSave(e); }}
                    className="p-0.5 rounded-full hover:bg-muted"
                  >
                    <Heart className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                )}
                {onCall && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onCall(e); }}
                    className="p-0.5 rounded-full hover:bg-muted"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </button>
                )}
                {onMap && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onMap(e); }}
                    className="p-0.5 rounded-full hover:bg-muted"
                  >
                    <Navigation className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rating + Location */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {rating != null && rating > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {rating.toFixed(1)}
                {reviewCount != null && reviewCount > 0 && (
                  <span className="text-muted-foreground">({reviewCount})</span>
                )}
              </span>
            )}
            {!rating && (
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-medium">
                New
              </span>
            )}
            {location && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground truncate">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {location}
              </span>
            )}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom row: Price + availability + CTA */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {price && (
              <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                {price}
                {priceLabel && (
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {priceLabel}
                  </span>
                )}
              </span>
            )}
            {availability && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {availability}
              </span>
            )}
            {extraContent}
          </div>
          <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg flex-shrink-0">
            {ctaLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
