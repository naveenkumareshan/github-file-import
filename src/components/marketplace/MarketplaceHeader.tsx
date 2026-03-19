import React from 'react';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface MarketplaceHeaderProps {
  title: string;
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
}

export const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  title,
  searchPlaceholder = 'Search...',
  searchQuery,
  onSearchChange,
  filters,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="px-3 pt-3 pb-2 max-w-lg lg:max-w-5xl mx-auto">
        <h1 className="text-base font-semibold mb-2 lg:text-xl text-foreground">
          {title}
        </h1>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-9 rounded-xl border border-border bg-card text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-shadow"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => onFilterChange(f.id)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
                activeFilter === f.id
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
