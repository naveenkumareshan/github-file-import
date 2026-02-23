import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { AirVent, ToiletIcon, DoorOpen, MonitorPlay, Save, Wind } from "lucide-react";
import { format } from "date-fns";

interface Position {
  x: number;
  y: number;
}

export interface Seat {
  _id: string;
  id: string;
  number: number;
  cabinId: string;
  price: number;
  position: Position;
  isAvailable: boolean;
  isHotSelling: boolean;
  unavailableUntil?: string;
}

export interface RoomElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  rotation?: number; // Added rotation property
}

interface SeatMapEditorProps {
  seats: Seat[];
  onSeatSelect: (seat: Seat) => void;
  selectedSeat: Seat | null;
  isAdmin: boolean;
  readOnly?: boolean;
  onSavePositions?: () => void;
  roomElements?: RoomElement[];
  cabinId?: string; // Add the missing cabinId prop
  initialRoomElements?: RoomElement[]; // Add initialRoomElements prop
  initialSeats?: any[]; // Add initialSeats prop
  onSave?: (newRoomElements: RoomElement[], newSeats: any[]) => Promise<void>; // Add onSave prop
  isSaving?: boolean; // Add isSaving prop
}

export const SeatMapEditor: React.FC<SeatMapEditorProps> = ({
  seats,
  onSeatSelect,
  selectedSeat,
  isAdmin,
  readOnly = false,
  onSavePositions,
  roomElements = [],
  cabinId,
  initialRoomElements,
  initialSeats,
  onSave,
  isSaving
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [draggingSeat, setDraggingSeat] = useState<Seat | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [draggedSeats, setDraggedSeats] = useState<string[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);

    // Map element types to their icons
    const elementIcons = {
      door: DoorOpen,
      bath: ToiletIcon,
      window: Wind,
      screen: MonitorPlay,
      AC: AirVent
    };

  const getSeatStatusColor = (seat: Seat) => {
    if (selectedSeat?._id === seat._id) return "bg-cabin-dark text-white";

    if (!seat.isAvailable){
      return "bg-[#D3E4FD] text-blue-600 border-blue-200 cursor-not-allowed";
    }

    return "bg-[#d4f7c4] text-cabin-green border-cabin-green hover:bg-cabin-green/10";
  };

  const handleSeatMouseDown = (e: React.MouseEvent, seat: Seat) => {
    if (readOnly || !isAdmin) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggingSeat(seat);
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingSeat || readOnly || !isAdmin || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    const clampedX = Math.max(0, Math.min(x, rect.width - 40));
    const clampedY = Math.max(0, Math.min(y, rect.height - 40));
    
    draggingSeat.position.x = Math.round(clampedX / 20) * 20
    draggingSeat.position.y = Math.round(clampedY / 20) * 20

    const updatedDraggedSeats = [...draggedSeats];
    if (!updatedDraggedSeats.includes(draggingSeat._id)) {
      updatedDraggedSeats.push(draggingSeat._id);
    }

    setDraggedSeats(updatedDraggedSeats);
  };

  const handleMouseUp = () => {
    setDraggingSeat(null);
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Render room elements with rotation support
  const renderRoomElements = () => {
    return roomElements.map((element) => {
      let elementClass = 'absolute text-xs font-medium px-2 py-1 rounded flex items-center space-x-2';
      
      // Apply different styles based on element type
      switch (element.type) {
        case 'door':
          elementClass += ' bg-cabin-green/20 text-cabin-green';
          break;
        case 'washroom':
          elementClass += ' bg-blue-100 text-blue-800';
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
        case 'office':
          elementClass += ' bg-gray-100 text-gray-800 border border-gray-200';
          break;
        case 'AC':
            elementClass += ' bg-gray-100 text-gray-800 border border-gray-200';
            break;
        case 'entrance':
          elementClass += ' bg-cabin-green/20 text-cabin-green';
          break;
        default:
          elementClass += ' bg-white/80 border text-gray-800';
      }
      
      // Get element display label
      const elementLabel = 
        element.type === 'entrance' ? 'Entrance' : 
        element.type === 'door' ? 'Door' : 
        element.type === 'washroom' ? 'Washroom' : 
        element.type === 'bath' ? 'Bathroom' : 
        element.type === 'window' ? 'Window' : 
        element.type === 'office' ? 'Office' : 
        element.type === 'AC' ? 'AC' : 
        element.type;


        const ElementIcon = elementIcons[element.type];

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
    <div className="seat-map-editor">
      {isAdmin && !readOnly && onSavePositions && (
        <div className="flex justify-end mb-4">
          <Button
            onClick={onSavePositions}
            className="flex items-center gap-2"
            disabled={draggedSeats.length === 0}
          >
            <Save className="h-4 w-4" />
            Save Seat Positions
          </Button>
        </div>
      )}

      <ScrollArea className="h-[400px] border rounded-md">
        <div
          ref={mapRef}
          className="relative bg-[#f6f8fa] rounded-lg p-8"
          style={{ minHeight: "600px", minWidth: "600px", height: "100%" }}
          onMouseMove={handleMouseMove}
          onClick={(e) => e.stopPropagation()}
        >

        {/* Room layout elements */}
        {renderRoomElements()}

          <TooltipProvider>
            {seats.map((seat) => (
              <Tooltip key={seat._id}>
                <TooltipTrigger asChild>
                  <button
                    className={`
                      absolute transition-all border rounded 
                      flex items-center justify-center 
                      text-[11px] font-semibold
                      ${getSeatStatusColor(seat)}
                    `}
                    style={{
                      left: seat.position.x,
                      top: seat.position.y,
                      width: 32,
                      height: 22,
                      cursor:
                        !seat.isAvailable && !isAdmin
                          ? "not-allowed"
                          : isAdmin && !readOnly
                          ? "grab"
                          : "pointer",
                      zIndex: draggingSeat?._id === seat._id ? 10 : 1,
                    }}
                    onMouseDown={(e) => handleSeatMouseDown(e, seat)}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (seat.isAvailable || isAdmin) {
                        onSeatSelect(seat);
                      }
                    }}
                    onMouseEnter={() => setHoveredSeat(seat)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    disabled={!seat.isAvailable && !isAdmin}
                  >
                    {seat.number}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <div>
                    <div className="font-bold text-xs mb-1">
                      Seat {seat.number}
                    </div>
                    <div>
                      Status:{" "}
                      {seat.isAvailable
                        ? "Available"
                        : "Unavailable"}
                    </div>
                    <div>Price: ₹{seat.price}/month</div>
                      {!seat.isAvailable && seat.unavailableUntil && (
                        <div>Unavailable until: {seat.unavailableUntil ? format(new Date(seat.unavailableUntil), "dd MMM yyyy hh:mm:ss a") : ""}</div>
                      )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
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

      {hoveredSeat && hoveredSeat.isAvailable && (
        <div className="mt-4 p-2 bg-cabin-light/20 rounded-md text-center text-xs">
          <p>
            Seat #{hoveredSeat.number} - ₹{hoveredSeat.price}/month
          </p>
        </div>
      )}
    </div>
  );
};
