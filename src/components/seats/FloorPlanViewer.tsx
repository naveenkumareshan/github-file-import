import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider, Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, Maximize, Building2 } from 'lucide-react';
import { RoomWalls } from './RoomWalls';
import { format } from 'date-fns';
import type { Section } from './FloorPlanDesigner';

interface ViewerSeat {
  _id: string;
  id: string;
  number: number;
  price: number;
  position: { x: number; y: number };
  isAvailable: boolean;
  unavailableUntil?: string;
  conflictingBookings?: any[];
  sectionId?: string;
}

interface FloorPlanViewerProps {
  seats: ViewerSeat[];
  sections: Section[];
  roomWidth: number;
  roomHeight: number;
  onSeatSelect?: (seat: ViewerSeat) => void;
  selectedSeat?: ViewerSeat | null;
  dateRange?: { start: Date; end: Date };
}

const STRUCTURAL_COLORS: Record<string, string> = {
  Washroom: 'bg-blue-100 border-blue-300 text-blue-700',
  Office: 'bg-amber-100 border-amber-300 text-amber-700',
  Lockers: 'bg-violet-100 border-violet-300 text-violet-700',
  Storage: 'bg-stone-100 border-stone-300 text-stone-700',
  Custom: 'bg-muted border-border text-muted-foreground',
};

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  seats,
  sections,
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

  const renderSectionSeats = (section: Section) => {
    if (section.type !== 'seats') return null;
    const sectionSeats = seats.filter(s => s.sectionId === section.id);

    return sectionSeats.map(seat => {
      const isSelected = selectedSeat?._id === seat._id;
      const isBooked = !seat.isAvailable;

      let seatClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100 cursor-pointer';
      if (isSelected) seatClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/50 cursor-pointer';
      else if (isBooked) seatClass = 'bg-muted border-muted-foreground/30 text-muted-foreground cursor-not-allowed';

      return (
        <Tooltip key={seat._id}>
          <TooltipTrigger asChild>
            <button
              className={`absolute flex items-center justify-center rounded border text-[10px] font-bold transition-all ${seatClass}`}
              style={{
                left: seat.position.x - section.position.x,
                top: seat.position.y - section.position.y,
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
    });
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
            {/* Sections */}
            {sections.map(section => {
              const isStructural = section.type === 'structural';
              const colorClass = isStructural
                ? (STRUCTURAL_COLORS[section.structuralLabel || 'Custom'] || STRUCTURAL_COLORS.Custom)
                : 'bg-background border-primary/30';

              return (
                <div
                  key={section.id}
                  className={`absolute rounded-lg border-2 overflow-hidden ${colorClass}`}
                  style={{
                    left: section.position.x,
                    top: section.position.y,
                    width: section.width,
                    height: section.height,
                    zIndex: 3,
                  }}
                >
                  {/* Section label */}
                  <div className="px-2 py-1 border-b border-inherit bg-inherit">
                    <span className="text-xs font-semibold">{section.name}</span>
                  </div>

                  {/* Section body */}
                  <div className="relative w-full" style={{ height: section.height - 28 }}>
                    {isStructural ? (
                      <div className="flex items-center justify-center h-full">
                        <Building2 className="h-8 w-8 opacity-30" />
                      </div>
                    ) : (
                      renderSectionSeats(section)
                    )}
                  </div>
                </div>
              );
            })}
          </TooltipProvider>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded border border-emerald-400 bg-emerald-50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded border border-primary bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded border border-muted-foreground/30 bg-muted" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};
