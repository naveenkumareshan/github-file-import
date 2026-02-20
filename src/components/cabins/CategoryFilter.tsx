
import React from 'react';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  filter: 'all' | 'standard' | 'premium' | 'luxury';
  setFilter: (filter: 'all' | 'standard' | 'premium' | 'luxury') => void;
}

const categories = [
  { id: 'all', label: 'All Rooms' },
  { id: 'standard', label: 'Standard' },
  { id: 'premium', label: 'Premium' },
  { id: 'luxury', label: 'Luxury' }
] as const;

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ filter, setFilter }) => {
  return (
    <div className="flex justify-center mb-12">
      <div className="inline-flex bg-card rounded-xl p-1.5 shadow-card border border-border">
        {categories.map((category) => (
          <button
            key={category.id}
            className={cn(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              filter === category.id 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            onClick={() => setFilter(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
};