
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
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="relative">
          <div className="aspect-video w-full overflow-hidden">
            <img 
              src={cabin.imageUrl || '/placeholder.svg'} 
              alt={cabin.name} 
              className="w-full h-full object-cover"
            />
          </div>
          <Badge 
            className={`absolute top-2 right-2 ${getCategoryBadgeColor(cabin.category)}`}
          >
            {cabin.category}
          </Badge>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          {/* <h3 className="text-lg font-semibold">{cabin.name}</h3> */}
          <h3 className="font-medium text-lg">
            { user?.role =='admin' && cabin.vendorId && 
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded mr-2 text-xs">
                Business Name : {cabin.vendorId.businessName}
              </span>
            }
            <br/>
            {cabin.cabinCode && 
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded mr-2 text-xs">
                #{cabin.cabinCode}
              </span>
            }
            {cabin.name}
            {cabin.isActive === false && 
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded ml-2 text-xs">
                Inactive
              </span>
            }
            <br></br>
            <span
              className={`py-1 rounded text-xs ${
                !cabin.isBookingActive
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
             Booking {!cabin.isBookingActive ? "Disabled" : "Enabled"}
            </span>

          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{cabin.description}</p>
          <div className="flex justify-between items-center mt-auto">
            <div>
              <p className="font-medium">₹{cabin.price}/month</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>Capacity: {cabin.capacity}</span>
              </div>
            </div>
            </div>
            <div className="flex justify-between items-center mt-auto">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8"
                  onClick={() => onEdit(cabin)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                {/* <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-red-500"
                  onClick={() => onDelete(cabin._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button> */}
                <Button
                  size="sm"
                  onClick={() => onManageSeats(cabin._id)}
                  className="h-8"
                >
                  Seats
                </Button>

                {onToggleActive && (
                  <Button 
                    size="sm" 
                    variant={cabin.isActive ? "outline" : "default"} 
                    onClick={() => onToggleActive(cabin._id, !cabin.isActive)}
                    className={
                      cabin.isActive
                        ? "text-red-600 border-red-600 hover:bg-red-50"
                        : "bg-green-600 hover:bg-green-700"
                    }
                  >
                    {cabin.isActive ? (
                      <><FileMinus className="h-4 w-4 mr-1" /> Deactivate</>
                    ) : (
                      <><FilePlus className="h-4 w-4 mr-1" /> Activate</>
                    )}
                  </Button>
                )}

                {onToggleBooking && (
                  <Button 
                    size="sm" 
                    variant={!cabin.isBookingActive ? "default" : "outline"} 
                    onClick={() => onToggleBooking(cabin._id, !cabin.isBookingActive)}
                    className={
                      !cabin.isBookingActive
                        ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                        : "text-orange-600 border-orange-600 hover:bg-orange-50"
                    }
                  >
                    {!cabin.isBookingActive ? (
                      <>▶️ Booking</>
                    ) : (
                      <>⏸️ Booking</>
                    )}
                  </Button>
                )}
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
