
import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { AirVent, Bath, Bed, DoorOpen, Info, MonitorPlay, Wind } from 'lucide-react';

export interface HostelBed {
  _id: string;
  number: number;
  roomNumber: string;
  floor: string;
  price: number;
  bedType: 'single' | 'double' | 'bunk';
  sharingType: 'private' | '2-sharing' | '3-sharing' | '4-sharing' | '5-sharing' | '6-sharing';
  isAvailable: boolean;
  position?: {
    x: number;
    y: number;
  };
  amenities?: string[];
  hostelId?: string;
  roomId?: string;
}

export interface RoomElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  rotation?: number;
}

interface HostelRoomMapProps {
  roomData: any;
  beds: HostelBed[];
  selectedBed: HostelBed | null;
  onBedSelect: (bed: HostelBed) => void;
  readOnly?: boolean;
}

export function HostelRoomMap({ 
  roomData, 
  beds, 
  selectedBed, 
  onBedSelect,
  readOnly = false 
}: HostelRoomMapProps) {
  const [hoveredBed, setHoveredBed] = useState<number | null>(null);
  
  const roomElements = roomData?.roomElements || [];

  // Map element types to their icons
  const elementIcons = {
    door: DoorOpen,
    bath: Bath,
    window: Wind,
    screen: MonitorPlay,
    AC: AirVent
  };

  const getBedStatusColor = (bed: HostelBed) => {
    if (selectedBed?._id === bed._id) return 'bg-cabin-dark text-white';
    
    if (!bed.isAvailable) {
      return 'bg-[#D3E4FD] text-blue-600 border-blue-200 cursor-not-allowed';
    }
    
    return 'bg-[#d4f7c4] text-cabin-green border-cabin-green hover:bg-cabin-green/10';
  };

  // Auto-position beds if no positions provided
  const renderBeds = () => {
    return beds.map((bed, index) => {
      // Use position from DB or auto-calculate
      const bedWidth = 100;    // must match your button width
      const bedHeight = 50;    // must match your button height
      const gapX = 20;          // horizontal gap
      const gapY = 20;          // vertical gap

      const position = bed.position || {
        x: (index % 4) * (bedWidth + gapX) + 60,
        y: Math.floor(index / 4) * (bedHeight + gapY) + 130
      };
      
      return (
        <Tooltip key={bed._id}>
          <TooltipTrigger asChild>
            <button
              className={`
                absolute transition-all border rounded-lg
                flex flex-col items-center justify-center
                ${getBedStatusColor(bed)}
              `}
              style={{
                left: position.x,
                top: position.y,
                width: 100,
                height: 50,
                cursor: !bed.isAvailable || readOnly ? 'default' : 'pointer',
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => {
                if (bed.isAvailable && !readOnly) {
                  onBedSelect(bed);
                }
              }}
              onMouseEnter={() => setHoveredBed(bed.number)}
              onMouseLeave={() => setHoveredBed(null)}
              disabled={!bed.isAvailable || readOnly}
            >
              <Bed className="h-4 w-4" />
              <div className="text-[10px] font-medium">Bed {bed.number}</div>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div>
              <div className="font-bold text-xs mb-1">Bed {bed.number}</div>
              <div className="mb-1">Room: {bed.roomNumber}</div>
              <div className="mb-1">Floor: {bed.floor}</div>
              <div className="mb-1">
                Type: <Badge variant="outline">{bed.sharingType}</Badge>
              </div>
              <div className="mb-1">Price: ₹{bed.price}/day</div>
              <div>Status: {bed.isAvailable ? "Available" : "Unavailable"}</div>
              {bed.amenities && bed.amenities.length > 0 && (
                <div className="mt-1">
                  Amenities: {bed.amenities.join(', ')}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      );
    });
  };

  // Render room elements (doors, washrooms, etc.) with rotation support
  const renderRoomElements = () => {
    return roomElements.map((element: RoomElement) => {
      let elementClass = 'absolute text-xs font-medium px-2 py-1 rounded rounded flex items-center space-x-2';
      
      // Apply different styles based on element type
      switch (element.type) {
        case 'door':
          elementClass += ' bg-cabin-green/20 text-cabin-green';
          break;
        case 'bath':
          elementClass += ' bg-blue-100 text-blue-800';
          break;
        case 'window':
          elementClass += ' bg-sky-100 text-sky-800 border border-sky-200';
          break;
        case 'screen':
          elementClass += ' bg-gray-100 text-gray-800 border border-gray-200';
          break;
        case 'AC':
          elementClass += ' bg-gray-100 text-gray-800 border border-gray-200';
          break;
        default:
          elementClass += ' bg-white/80 border text-gray-800';
      }
      
      // Get display text for element type
      const elementLabel = 
        element.type === 'entrance' ? 'Entrance' : 
        element.type === 'door' ? 'Door' : 
        element.type === 'washroom' ? 'Washroom' : 
        element.type === 'bath' ? 'Bathroom' : 
        element.type === 'window' ? 'Window' : 
        element.type === 'screen' ? 'Screen' :
        element.type === 'AC' ? 'AC' :
        element.type;
      
      const ElementIcon = (elementIcons as any)[element.type] || Info;
      
      return (
        <div
          key={element.id}
          className={elementClass}
          style={{
            left: element.position.x,
            top: element.position.y,
            position: 'absolute',
            transform: `rotate(${element.rotation || 0}deg)`,
            transformOrigin: 'center'
          }}
        >
          {elementLabel}&nbsp;&nbsp;
          <ElementIcon 
            className="h-5 w-5" 
            data-type={element.type}
          />
        </div>
      );
    });
  };

  return (
    <div>
      <ScrollArea className="h-[500px] border rounded-lg">
        <div 
          className="relative bg-[#f6f8fa] rounded-lg p-8"
          style={{ 
            height: '600px', 
            width: '100%',
            minWidth: '500px',
            position: 'relative'
          }}
        >
          {/* Room layout elements */}
          {/* {renderRoomElements()} */}
          
          <TooltipProvider>
            {renderBeds()}
          </TooltipProvider>
        </div>
      </ScrollArea>
      
      <div className="mt-4 flex items-center justify-center flex-wrap gap-2 text-xs">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#d4f7c4] border border-cabin-green rounded-sm mr-2"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-cabin-dark rounded-sm mr-2"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#D3E4FD] border border-blue-200 rounded-sm mr-2"></div>
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  );
}
