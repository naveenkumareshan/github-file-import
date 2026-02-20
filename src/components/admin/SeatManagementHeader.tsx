
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface SeatManagementHeaderProps {
  cabinName: string;
  cabinSerialNumber?: string;
  cabinCategory?: 'standard' | 'premium' | 'luxury';
  cabinPrice?: number;
  cabinCapacity?: number;
  onBack: () => void;
}

export function SeatManagementHeader({ 
  cabinName, 
  cabinSerialNumber, 
  cabinCategory, 
  cabinPrice,
  cabinCapacity,
  onBack 
}: SeatManagementHeaderProps) {
  return (
    <div className="p-6 border-b">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-1 hover:bg-accent/50"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Reading Rooms</span>
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-xl font-medium flex items-center">
          {cabinName}
          {cabinSerialNumber && 
            <span className="bg-gray-100 text-gray-700 text-sm px-2 py-1 rounded ml-2">
              #{cabinSerialNumber}
            </span>
          }
          {cabinCategory && 
            <span className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded ml-2">
              {cabinCategory.charAt(0).toUpperCase() + cabinCategory.slice(1)}
            </span>
          }
        </h3>
        <div className="flex mt-1">
          <p className="text-muted-foreground">Manage seats for this reading room</p>
          {cabinPrice && <p className="text-muted-foreground ml-4">₹{cabinPrice}/month</p>}
          {cabinCapacity && <p className="text-muted-foreground ml-4">Capacity: {cabinCapacity}</p>}
        </div>
      </div>
    </div>
  );
}
