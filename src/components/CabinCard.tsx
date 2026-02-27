
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatManagementLink } from '@/components/admin/SeatManagementLink';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getTimingDisplay, getClosedDaysDisplay } from '@/utils/timingUtils';
import { Clock } from 'lucide-react';

export interface Cabin {
  id: number | string;
  _id: number | string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities?: string[];
  imageUrl?: string;
  category?: string;
  cabinCode?: string;
  isActive?: boolean;
  averageRating?: number;
  reviewCount?: number;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string[];
}

interface CabinCardProps {
  cabin: Cabin;
}

const categoryStyles = {
  luxury: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  premium: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20' },
  standard: { bg: 'bg-secondary/10', text: 'text-secondary', border: 'border-secondary/20' }
};

export const CabinCard = ({ cabin }: CabinCardProps) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'hostel_manager';
  const categoryKey = (cabin.category || 'standard') as keyof typeof categoryStyles;
  const styles = categoryStyles[categoryKey] || categoryStyles.standard;
  
  const hasRating = (cabin.reviewCount || 0) > 0;

  return (
    <Link to={`/book-seat/${cabin._id}`} className="block group">
      <Card className="overflow-hidden border-0 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 bg-card h-full">
        {/* Image */}
        <div className="aspect-[4/3] relative overflow-hidden">
          <img 
            src={cabin.imageUrl || 'https://images.unsplash.com/photo-1513694203232-719a280e022f'} 
            alt={cabin.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Rating Badge - Top Left */}
          <div className="absolute top-4 left-4">
            {hasRating ? (
              <Badge className="bg-white/95 text-foreground backdrop-blur-sm shadow-lg border-0 px-2.5 py-1 text-xs font-semibold">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 mr-1" />
                {(cabin.averageRating || 0).toFixed(1)} ({cabin.reviewCount})
              </Badge>
            ) : (
              <Badge className="bg-emerald-500 text-white border-0 px-2.5 py-1 text-xs font-semibold">
                New
              </Badge>
            )}
          </div>

          {cabin.category && (
            <div className="absolute top-4 right-4">
              <span className={cn(
                "inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg capitalize border backdrop-blur-sm",
                styles.bg, styles.text, styles.border
              )}>
                {cabin.category}
              </span>
            </div>
          )}
          
          {/* Price Badge */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
              <div className="text-xs text-muted-foreground">Starting from</div>
              <div className="text-xl font-bold text-foreground">₹{cabin.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
            </div>
          </div>
        </div>
        
        <CardHeader className="pb-2 pt-5">
          <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
            {cabin.name}
          </CardTitle>
          {(cabin.openingTime && cabin.closingTime) && (
            <div className="flex flex-col gap-0.5 mt-1">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
                <Clock className="w-3 h-3" />
                {getTimingDisplay(cabin.openingTime, cabin.closingTime)}
              </span>
              {getClosedDaysDisplay(cabin.workingDays) && (
                <span className="text-xs text-destructive/80 font-medium">
                  {getClosedDaysDisplay(cabin.workingDays)}
                </span>
              )}
            </div>
          )}
          {cabin.cabinCode && (
            <CardDescription className="text-xs text-muted-foreground">
              Room ID: {cabin.cabinCode}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="pb-4 space-y-4">
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {cabin.description}
          </p>
          
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-muted rounded-lg font-medium text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              {cabin.capacity} seats
            </span>
            {cabin.amenities && cabin.amenities.slice(0, 2).map((amenity, i) => (
              <span key={i} className="text-xs px-3 py-1.5 bg-muted rounded-lg font-medium text-muted-foreground">
                {amenity}
              </span>
            ))}
            {cabin.amenities && cabin.amenities.length > 2 && (
              <span className="text-xs px-3 py-1.5 bg-muted rounded-lg font-medium text-muted-foreground">
                +{cabin.amenities.length - 2} more
              </span>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 pb-5">
          {isAdmin ? (
            <SeatManagementLink cabinId={cabin._id} isAdmin={true} variant="outline" />
          ) : (
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 group/btn">
              Book Now
              <ChevronRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
};
