import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchX } from 'lucide-react';

interface MarketplaceEmptyProps {
  icon?: React.ReactNode;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaTo?: string;
}

export const MarketplaceEmpty: React.FC<MarketplaceEmptyProps> = ({
  icon,
  title = 'Nothing found',
  subtitle = 'Try adjusting your search or filters.',
  ctaLabel,
  ctaTo,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        {icon || <SearchX className="h-8 w-8 text-muted-foreground" />}
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs">{subtitle}</p>
      {ctaLabel && ctaTo && (
        <button
          onClick={() => navigate(ctaTo)}
          className="text-xs font-semibold text-primary bg-primary/10 px-4 py-2 rounded-xl hover:bg-primary/20 transition-colors"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};
