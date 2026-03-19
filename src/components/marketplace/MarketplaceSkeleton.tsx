import React from 'react';

interface MarketplaceSkeletonProps {
  count?: number;
}

export const MarketplaceSkeleton: React.FC<MarketplaceSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="flex gap-3.5 p-3 bg-card rounded-2xl border border-border shadow-sm animate-pulse"
        >
          <div className="w-24 h-24 rounded-xl bg-muted flex-shrink-0" />
          <div className="flex-1 space-y-2.5 py-1">
            <div className="h-3.5 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="flex gap-1.5">
              <div className="h-5 bg-muted rounded w-12" />
              <div className="h-5 bg-muted rounded w-10" />
              <div className="h-5 bg-muted rounded w-8" />
            </div>
            <div className="h-3 bg-muted rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};
