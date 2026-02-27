
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BedDouble } from 'lucide-react';

interface BedData {
  id: string;
  bed_number: number;
  is_available: boolean;
  is_blocked: boolean;
  room_id: string;
  sharing_option_id: string;
  sharingType?: string;
  price?: number;
  occupantName?: string;
}

interface RoomGroup {
  roomId: string;
  roomNumber: string;
  category: string;
  beds: BedData[];
}

interface HostelFloorViewProps {
  floorNumber: number;
  rooms: RoomGroup[];
  selectedBedId?: string | null;
  onBedSelect?: (bed: BedData) => void;
  readOnly?: boolean;
}

export const HostelFloorView: React.FC<HostelFloorViewProps> = ({
  floorNumber,
  rooms,
  selectedBedId,
  onBedSelect,
  readOnly = false,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Floor {floorNumber}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => {
          const totalBeds = room.beds.length;
          const availableBeds = room.beds.filter(b => b.is_available && !b.is_blocked).length;
          const occupancyPercent = totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds) * 100 : 0;

          return (
            <div
              key={room.roomId}
              className="border rounded-xl p-4 bg-card"
            >
              {/* Room header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-semibold text-sm">Room {room.roomNumber}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {room.category}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {availableBeds}/{totalBeds} available
                </span>
              </div>

              {/* Occupancy bar */}
              <Progress value={occupancyPercent} className="h-1.5 mb-3" />

              {/* Bed grid */}
              <TooltipProvider>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {room.beds.map((bed) => {
                    const isSelected = selectedBedId === bed.id;
                    const isAvailable = bed.is_available && !bed.is_blocked;
                    const isBlocked = bed.is_blocked;

                    let bgClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100';
                    if (isSelected) bgClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/30';
                    else if (isBlocked) bgClass = 'bg-destructive/10 border-destructive/30 text-destructive';
                    else if (!isAvailable) bgClass = 'bg-blue-50 border-blue-400 text-blue-800';

                    return (
                      <Tooltip key={bed.id}>
                        <TooltipTrigger asChild>
                          <button
                            className={`flex flex-col items-center justify-center rounded-lg border p-2 text-[10px] font-bold transition-all ${bgClass} ${
                              !readOnly && isAvailable ? 'cursor-pointer' : readOnly ? 'cursor-default' : 'cursor-not-allowed'
                            }`}
                            onClick={() => {
                              if (!readOnly && isAvailable && onBedSelect) {
                                onBedSelect(bed);
                              }
                            }}
                            disabled={!isAvailable && !readOnly}
                          >
                            <BedDouble className="h-3.5 w-3.5 mb-0.5" />
                            {bed.bed_number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-0.5">
                            <p className="font-bold">Bed #{bed.bed_number}</p>
                            {bed.sharingType && <p>Type: {bed.sharingType}</p>}
                            {bed.price !== undefined && <p>₹{bed.price}/month</p>}
                            <p>
                              {isBlocked ? '🚫 Blocked' : isAvailable ? '✅ Available' : '👤 Occupied'}
                            </p>
                            {bed.occupantName && <p>Guest: {bed.occupantName}</p>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          );
        })}
      </div>
    </div>
  );
};
