
import React from 'react';
import { CabinCard } from '../CabinCard';
import { Cabin } from '../../data/cabinsData';
import { Card, CardContent } from '../ui/card';
import ErrorBoundary from '../ErrorBoundary';
import { BookOpen } from 'lucide-react';

interface CabinsGridProps {
  cabins: Cabin[];
}

export const CabinsGrid: React.FC<CabinsGridProps> = ({ cabins }) => {
  // Ensure cabins is always an array, even if it's null or undefined
  const cabinsList = Array.isArray(cabins) ? cabins : [];
  
  return (
    <ErrorBoundary>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {cabinsList.length > 0 ? (
          cabinsList.map((cabin: Cabin) => (
            <CabinCard key={cabin.id} cabin={cabin} />
          ))
        ) : (
          <Card className="col-span-3 border-0 shadow-card bg-card">
            <CardContent className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg text-muted-foreground">No reading rooms found matching your filters.</p>
              <p className="text-sm text-muted-foreground">Try selecting a different category.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
};