import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DoorOpen, ToiletIcon, Wind, MonitorPlay, AirVent,
  ZoomIn, ZoomOut, Maximize,
} from 'lucide-react';
import { RoomWalls } from './RoomWalls';
import { format } from 'date-fns';

interface RoomElement {
  id: string;
  type: string;
  position: { x: number; y: number };
  rotation?: number;
}

interface ViewerSeat {
  _id: string;
  id: string;
  number: number;
  price: number;
  position: { x: number; y: number };
  isAvailable: boolean;
  unavailableUntil?: string;
  conflictingBookings?: any[];
}

interface FloorPlanViewerProps {
  seats: ViewerSeat[];
  roomElements: RoomElement[];
  roomWidth: number;
  roomHeight: number;
  onSeatSelect?: (seat: ViewerSeat) => void;
  selectedSeat?: ViewerSeat | null;
  dateRange?: { start: Date; end: Date };
}

const ELEMENT_ICONS: Record<string, React.ElementType> = {
  door: DoorOpen, bath: ToiletIcon, window: Wind, screen: MonitorPlay, AC: AirVent,
};

const ELEMENT_LABELS: Record<string, string> = {
  door: 'Door', bath: 'Bath', window: 'Window', screen: 'Screen', AC: 'AC',
};

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  seats,
  roomElements,
  roomWidth,
  roomHeight,
  onSeatSelect,
  selectedSeat,
  dateRange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const scaleX = (el.clientWidth - 40) / roomWidth;
    const scaleY = (el.clientHeight - 40) / roomHeight;
    setZoom(Math.min(scaleX, scaleY, 1.5));
    setPan({ x: 20, y: 20 });
  }, [roomWidth, roomHeight]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.25, Math.min(z + (e.deltaY > 0 ? -0.1 : 0.1), 3)));
  };

  return (
    <div className="space-y-3">
      {/* Zoom controls */}
      <div className="flex items-center justify-end gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
        <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleZoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleFitToScreen}><Maximize className="h-3.5 w-3.5" /></Button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative overflow-hidden border rounded-lg bg-muted/30"
        style={{ height: '450px', cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute bg-background rounded shadow-sm"
          style={{
            width: roomWidth,
            height: roomHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <RoomWalls width={roomWidth} height={roomHeight} />

          <TooltipProvider>
            {/* Room elements */}
            {roomElements.map(element => {
              const Icon = ELEMENT_ICONS[element.type] || DoorOpen;
              return (
                <div
                  key={element.id}
                  className="absolute flex items-center gap-1 px-2 py-1 rounded bg-background/80 border text-xs font-medium pointer-events-none select-none"
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    transformOrigin: 'center',
                    zIndex: 5,
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{ELEMENT_LABELS[element.type] || element.type}</span>
                </div>
              );
            })}

            {/* Seats */}
            {seats.map(seat => {
              const isSelected = selectedSeat?._id === seat._id;
              const isBooked = !seat.isAvailable;

              let bgClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-700 hover:bg-emerald-500/30 cursor-pointer';
              if (isSelected) bgClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/50 cursor-pointer';
              else if (isBooked) bgClass = 'bg-destructive/15 border-destructive/40 text-destructive cursor-not-allowed';

              return (
                <Tooltip key={seat._id}>
                  <TooltipTrigger asChild>
                    <button
                      className={`absolute flex items-center justify-center rounded border text-[11px] font-bold transition-all ${bgClass}`}
                      style={{
                        left: seat.position.x,
                        top: seat.position.y,
                        width: 36,
                        height: 26,
                        zIndex: isSelected ? 20 : 10,
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        if (seat.isAvailable && onSeatSelect) onSeatSelect(seat);
                      }}
                      disabled={isBooked}
                    >
                      {seat.number}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-bold">Seat {seat.number}</p>
                      <p>₹{seat.price}/month</p>
                      <p>{seat.isAvailable ? '✅ Available' : '❌ Booked'}</p>
                      {!seat.isAvailable && seat.unavailableUntil && (
                        <p>Until: {format(new Date(seat.unavailableUntil), 'dd MMM yyyy')}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded border border-emerald-500 bg-emerald-500/20" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded border border-primary bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded border border-destructive/40 bg-destructive/15" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};
