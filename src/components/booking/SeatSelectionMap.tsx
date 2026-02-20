
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RoomSeatButton, RoomSeat } from '../RoomSeatButton';
import { Bed, User, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Seat {
  id: string;
  number: number;
  position: { x: number; y: number };
  isAvailable: boolean;
  price: number;
  isHotSelling?: boolean;
  sharingType?: string;
}

interface Bed {
  id: string;
  number: number;
  position: { x: number; y: number };
  isAvailable: boolean;
  price: number;
  sharingType: string;
}

interface SeatSelectionMapProps {
  roomId: string;
  seats?: Seat[];
  beds?: Bed[];
  onSeatSelect: (seat: Seat | null) => void;
  onBedSelect?: (bed: Bed | null) => void;
  selectedSeat?: Seat | null;
  selectedBed?: Bed | null;
  viewType?: 'seat' | 'bed' | 'both';
  isLoading?: boolean;
  error?: string | null;
}

export const SeatSelectionMap: React.FC<SeatSelectionMapProps> = ({
  roomId,
  seats = [],
  beds = [],
  onSeatSelect,
  onBedSelect,
  selectedSeat,
  selectedBed,
  viewType = 'seat',
  isLoading = false,
  error = null
}) => {
  const [activeTab, setActiveTab] = useState<string>(viewType === 'both' ? 'seats' : viewType === 'bed' ? 'beds' : 'seats');
  const [zoom, setZoom] = useState<number>(1);
  const [hovered, setHovered] = useState<string | null>(null);
  
  // Convert Seat objects to RoomSeat objects for rendering with RoomSeatButton
  const convertToRoomSeats = (seats: Seat[]): RoomSeat[] => {
    return seats.map(seat => ({
      id: parseInt(seat.id),
      number: seat.number,
      left: seat.position.x,
      top: seat.position.y,
      status: selectedSeat?.id === seat.id 
        ? 'selected'
        : !seat.isAvailable 
          ? 'sold' 
          : seat.isHotSelling 
            ? 'hot' 
            : 'available',
      price: seat.price
    }));
  };
  
  const roomSeats = convertToRoomSeats(seats);
  
  // Handle selecting a seat
  const handleSeatSelect = (seat: Seat) => {
    if (!seat.isAvailable) {
      toast({
        title: "Seat Unavailable",
        description: "This seat is currently not available for booking",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedSeat && selectedSeat.id === seat.id) {
      onSeatSelect(null);
    } else {
      onSeatSelect(seat);
    }
  };
  
  // Handle selecting a room seat (converted format)
  const handleRoomSeatClick = (roomSeat: RoomSeat) => {
    const originalSeat = seats.find(s => s.number === roomSeat.number);
    if (originalSeat) {
      handleSeatSelect(originalSeat);
    }
  };
  
  // Handle selecting a bed
  const handleBedSelect = (bed: Bed) => {
    if (!bed.isAvailable) {
      toast({
        title: "Bed Unavailable",
        description: "This bed is currently not available for booking",
        variant: "destructive"
      });
      return;
    }
    
    if (onBedSelect) {
      if (selectedBed && selectedBed.id === bed.id) {
        onBedSelect(null);
      } else {
        onBedSelect(bed);
      }
    }
  };
  
  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 0.2, 2));
  };
  
  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 0.2, 0.6));
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center text-red-500 p-4 border border-red-200 rounded-lg">
        {error}
      </div>
    );
  }
  
  return (
    <div className="w-full">
      {viewType === 'both' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="seats" className="flex-1">Seat View</TabsTrigger>
            <TabsTrigger value="beds" className="flex-1">Bed View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="seats" className="mt-0">
            {renderSeatsMap()}
          </TabsContent>
          
          <TabsContent value="beds" className="mt-0">
            {renderBedsMap()}
          </TabsContent>
        </Tabs>
      )}
      
      {viewType === 'seat' && renderSeatsMap()}
      {viewType === 'bed' && renderBedsMap()}
      
      <div className="flex justify-center items-center gap-4 mt-4">
        <Button variant="outline" size="sm" onClick={handleZoomOut}>-</Button>
        <span className="text-sm">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="sm" onClick={handleZoomIn}>+</Button>
      </div>
    </div>
  );
  
  function renderSeatsMap() {
    if (seats.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No seats available for this room
        </div>
      );
    }
    
    // Get the max dimensions of the seat positions to determine map size
    const maxX = Math.max(...seats.map(seat => seat.position.x)) + 60;
    const maxY = Math.max(...seats.map(seat => seat.position.y)) + 60;
    
    return (
      <div className="relative">
        <div className="flex justify-between mb-3">
          <div className="flex gap-2">
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              Available
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
              Booked
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
              Selected
            </div>
          </div>
        </div>

        <ScrollArea className="h-[300px] border rounded-md">
          <div 
            className="relative bg-gray-50 p-8"
            style={{ 
              width: Math.max(300, maxX), 
              height: Math.max(280, maxY),
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              transition: 'transform 0.2s'
            }}
          >
            {/* Room Layout Elements */}
            <div className="absolute bg-cabin-green text-white font-semibold rounded px-3 py-1 right-4 top-4">
              Entrance
            </div>
            <div className="absolute left-[55px] bottom-[40px] text-xs">
              <div className="flex gap-2">
                <div className="border rounded bg-white px-2">Washroom</div>
                <div className="border rounded bg-white px-2">Washroom</div>
              </div>
            </div>
            
            <TooltipProvider>
              {roomSeats.map((seat) => (
                <RoomSeatButton
                  key={seat.id}
                  seat={seat}
                  onSeatClick={handleRoomSeatClick}
                  onSeatHover={(id) => setHovered(id ? id.toString() : null)}
                />
              ))}
            </TooltipProvider>
          </div>
        </ScrollArea>
        
        {/* Selected Seat Info */}
        {selectedSeat && (
          <div className="mt-4 p-3 border rounded-md bg-muted/20">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Selected Seat: #{selectedSeat.number}</h4>
                <p className="text-sm text-muted-foreground">
                  Price: ₹{selectedSeat.price}
                  {selectedSeat.isHotSelling && <span className="text-pink-600"> (Hot selling!)</span>}
                </p>
              </div>
              <Badge variant="outline">Selected</Badge>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  function renderBedsMap() {
    if (beds.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No beds available for this room
        </div>
      );
    }
    
    // Group beds by sharingType
    const bedsByType = beds.reduce((acc, bed) => {
      const type = bed.sharingType || 'single';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(bed);
      return acc;
    }, {} as Record<string, Bed[]>);
    
    return (
      <div className="space-y-6">
        {Object.entries(bedsByType).map(([sharingType, bedsOfType]) => (
          <div key={sharingType} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium capitalize">{sharingType} Room</h3>
              <Badge variant="outline">
                {bedsOfType.filter(b => b.isAvailable).length} of {bedsOfType.length} available
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {bedsOfType.map((bed) => {
                const isSelected = selectedBed?.id === bed.id;
                const bedColor = isSelected 
                  ? 'bg-yellow-100 border-yellow-500 text-yellow-700' 
                  : bed.isAvailable 
                    ? 'bg-white border-green-500 text-green-700' 
                    : 'bg-gray-100 border-gray-500 text-gray-500';
                
                const textColor = isSelected 
                  ? 'text-yellow-700' 
                  : bed.isAvailable 
                    ? 'text-green-700' 
                    : 'text-gray-500';
                
                return (
                  <div
                    key={bed.id}
                    className={`p-3 rounded-lg border-2 ${bedColor} cursor-pointer transition-colors flex flex-col items-center`}
                    onClick={() => bed.isAvailable && handleBedSelect(bed)}
                  >
                    <Bed className={`h-6 w-6 ${textColor}`} />
                    <span className="text-sm mt-1">Bed {bed.number}</span>
                    <span className="text-xs font-medium mt-1">₹{bed.price}</span>
                    {isSelected && (
                      <Badge variant="secondary" className="mt-1 bg-yellow-200">
                        Selected
                      </Badge>
                    )}
                    {!bed.isAvailable && !isSelected && (
                      <Badge variant="secondary" className="mt-1 bg-gray-200">
                        Booked
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }
};
