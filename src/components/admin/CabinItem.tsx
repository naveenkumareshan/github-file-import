
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, FileMinus, FilePlus, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CabinData {
  _id: string;
  id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  amenities: string[];
  imageUrl: string; // Changed from imageSrc to imageUrl to match the data model
  category: 'standard' | 'premium' | 'luxury';
  isActive?: boolean;
  isBookingActive ?: boolean;
  vendorId:any;
  cabinCode?: string;
}

interface CabinItemProps {
  cabin: CabinData;
  onEdit: (cabin: CabinData) => void;
  onDelete: (cabinId: string) => void;
  onManageSeats: (cabinId: string) => void;
  onToggleActive?: (cabinId: string, isActive: boolean) => void;
  onToggleBooking?: (cabinId: string, isActive: boolean) => void;
}

  export function CabinItem({ cabin, onEdit, onDelete, onToggleActive, onToggleBooking , onManageSeats }: CabinItemProps) {
  const { user } = useAuth();
    
  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'luxury': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md">
      <CardContent className="p-0 flex-1 flex flex-col">
        {/* Image */}
        <div className="relative">
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={cabin.imageUrl || '/placeholder.svg'} 
              alt={cabin.name} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <Badge className={`absolute top-2 right-2 capitalize ${getCategoryBadgeColor(cabin.category)}`}>
            {cabin.category}
          </Badge>
          {cabin.isActive === false && (
            <span className="absolute top-2 left-2 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">
              Inactive
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col gap-2">
          {/* Meta row: vendor + code */}
          {(user?.role === 'admin' && cabin.vendorId) || cabin.cabinCode ? (
            <div className="flex items-center gap-2 flex-wrap">
              {user?.role === 'admin' && cabin.vendorId && (
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">
                  {cabin.vendorId.businessName}
                </span>
              )}
              {cabin.cabinCode && (
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-mono">
                  #{cabin.cabinCode}
                </span>
              )}
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${!cabin.isBookingActive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                Booking {!cabin.isBookingActive ? "Off" : "On"}
              </span>
            </div>
          ) : (
            <span className={`w-fit px-2 py-0.5 rounded text-xs font-medium ${!cabin.isBookingActive ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
              Booking {!cabin.isBookingActive ? "Disabled" : "Enabled"}
            </span>
          )}

          <h3 className="font-semibold text-base leading-tight">{cabin.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{cabin.description}</p>

          {/* Pricing & capacity */}
          <div className="flex justify-between items-center">
            <span className="font-bold text-base">₹{cabin.price}<span className="text-xs font-normal text-muted-foreground">/month</span></span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{cabin.capacity} seats</span>
            </div>
          </div>

          {/* Divider + Actions */}
          <div className="border-t pt-3 mt-1 flex flex-wrap gap-1.5">
            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onEdit(cabin)}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button size="sm" className="h-7 px-2" onClick={() => onManageSeats(cabin._id)}>
              <Users className="h-3.5 w-3.5 mr-1" />
              Seats
            </Button>
            {onToggleActive && (
              <Button 
                size="sm" 
                variant={cabin.isActive ? "outline" : "default"}
                className={`h-7 px-2 ${cabin.isActive ? "text-red-600 border-red-200 hover:bg-red-50" : "bg-green-600 hover:bg-green-700 text-white"}`}
                onClick={() => onToggleActive(cabin._id, !cabin.isActive)}
              >
                {cabin.isActive ? <><FileMinus className="h-3.5 w-3.5 mr-1" />Deactivate</> : <><FilePlus className="h-3.5 w-3.5 mr-1" />Activate</>}
              </Button>
            )}
            {onToggleBooking && (
              <Button 
                size="sm"
                variant={!cabin.isBookingActive ? "default" : "outline"}
                className={`h-7 px-2 ${!cabin.isBookingActive ? "bg-yellow-600 hover:bg-yellow-700 text-white" : "text-orange-600 border-orange-200 hover:bg-orange-50"}`}
                onClick={() => onToggleBooking(cabin._id, !cabin.isBookingActive)}
              >
                {!cabin.isBookingActive ? "▶ Booking" : "⏸ Booking"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
