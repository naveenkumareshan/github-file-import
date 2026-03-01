
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cabin } from '../../data/cabinsData';
import ErrorBoundary from '../ErrorBoundary';
import { BookOpen, Star, MapPin } from 'lucide-react';

interface CabinsGridProps {
  cabins: Cabin[];
}

export const CabinsGrid: React.FC<CabinsGridProps> = ({ cabins }) => {
  const navigate = useNavigate();
  const cabinsList = Array.isArray(cabins) ? cabins : [];

  if (cabinsList.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[14px] font-medium text-foreground mb-1">No reading rooms found</p>
        <p className="text-[12px] text-muted-foreground">Try selecting a different category.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <p className="text-[11px] text-muted-foreground mb-2.5">{cabinsList.length} rooms found</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {cabinsList.map((cabin: any) => (
          <div
            key={cabin.id}
            onClick={() => navigate(`/book-seat/${cabin.serial_number || cabin._id}`)}
            className="flex gap-3 p-3 bg-card rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.99] cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
              <img
                src={cabin.imageUrl || cabin.imageSrc}
                alt={cabin.name}
                className="w-full h-full object-cover"
              />
              {cabin.category && (
                <span className="absolute top-1 left-1 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md uppercase">
                  {cabin.category === 'standard' ? 'STD' : cabin.category === 'premium' ? 'PRE' : 'LUX'}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-foreground leading-tight truncate">{cabin.name}</h3>
                {(cabin.area || cabin.city) && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground truncate">
                      {cabin.area ? cabin.area + ', ' : ''}{cabin.city || ''}
                    </span>
                  </div>
                )}
                {cabin.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {cabin.amenities.slice(0, 3).map((a: string, i: number) => (
                      <span key={i} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                        {a.replace(/-/g, ' ')}
                      </span>
                    ))}
                    {cabin.amenities.length > 3 && (
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">+{cabin.amenities.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5">
                  {cabin.averageRating ? (
                    <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {Number(cabin.averageRating).toFixed(1)}
                      {cabin.reviewCount > 0 && <span>({cabin.reviewCount})</span>}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-md">New</span>
                  )}
                  {cabin.price && (
                    <span className="text-[11px] text-muted-foreground">₹{cabin.price}/mo</span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-lg flex-shrink-0">Book</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ErrorBoundary>
  );
};
