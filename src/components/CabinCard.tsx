
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatManagementLink } from '@/components/admin/SeatManagementLink';
import { useAuth } from '@/contexts/AuthContext';
import { Users, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

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