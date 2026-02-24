import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider, Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { format } from 'date-fns';
import { getImageUrl } from '@/lib/utils';

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
  category?: string;
}

interface FloorPlanViewerProps {
  seats: ViewerSeat[];
  roomWidth: number;
  roomHeight: number;
  onSeatSelect?: (seat: ViewerSeat) => void;
  selectedSeat?: ViewerSeat | null;
  dateRange?: { start: Date; end: Date };
  layoutImage?: string | null;
  layoutImageOpacity?: number;
  sections?: any[];
}

export const FloorPlanViewer: React.FC<FloorPlanViewerProps> = ({
  seats,
  roomWidth,
  roomHeight,
  onSeatSelect,
  selectedSeat,
  dateRange,
  layoutImage,
  layoutImageOpacity = 30,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

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

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-fit on mount
  useEffect(() => {
    const timer = setTimeout(handleFitToScreen, 100);
    return () => clearTimeout(timer);
  }, [handleFitToScreen]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const handleMouseUp = () => setIsPanning(false);

  // Touch handlers for mobile panning (no scroll-zoom)
  const touchStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      e.stopPropagation();
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, panX: pan.x, panY: pan.y };
      setIsPanning(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    setPan({ x: touchStartRef.current.panX + dx, y: touchStartRef.current.panY + dy });
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setIsPanning(false);
  };

  // Minimap
  const MINI_W = 120;
  const MINI_H = 90;
  const miniScale = Math.min(MINI_W / roomWidth, MINI_H / roomHeight);
  const vpRect = {
    x: Math.max(0, (-pan.x / zoom) * miniScale),
    y: Math.max(0, (-pan.y / zoom) * miniScale),
    w: containerSize.w > 0 ? (containerSize.w / zoom) * miniScale : MINI_W,
    h: containerSize.h > 0 ? (containerSize.h / zoom) * miniScale : MINI_H,
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const roomX = clickX / miniScale;
    const roomY = clickY / miniScale;
    const newPanX = -(roomX * zoom - containerSize.w / 2);
    const newPanY = -(roomY * zoom - containerSize.h / 2);
    setPan({ x: newPanX, y: newPanY });
  };

  const resolvedLayoutImage = layoutImage ? getImageUrl(layoutImage) : null;

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
        className="relative overflow-hidden border rounded-lg bg-muted/30 min-h-[350px] h-[60vh] touch-none"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
          {/* Background layout image */}
          {resolvedLayoutImage && (
            <img
              src={resolvedLayoutImage}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ opacity: layoutImageOpacity / 100, zIndex: 0 }}
            />
          )}

          <TooltipProvider>
            {seats.map(seat => {
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
                        left: seat.position.x - 18,
                        top: seat.position.y - 13,
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
                      {seat.category && <p>{seat.category}</p>}
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

        {/* Minimap */}
        <div
          className="absolute bottom-2 right-2 rounded border border-border/50 bg-background/80 backdrop-blur-sm cursor-crosshair"
          style={{ width: MINI_W, height: MINI_H, zIndex: 30 }}
          onClick={handleMinimapClick}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
        >
          {/* Mini seats */}
          {seats.map(seat => {
            const mx = seat.position.x * miniScale;
            const my = seat.position.y * miniScale;
            const isSelected = selectedSeat?._id === seat._id;
            const dotColor = isSelected
              ? 'bg-primary'
              : seat.isAvailable
                ? 'bg-emerald-500'
                : 'bg-muted-foreground/50';
            return (
              <div
                key={seat._id}
                className={`absolute rounded-full ${dotColor}`}
                style={{ left: mx - 1.5, top: my - 1.5, width: 3, height: 3 }}
              />
            );
          })}
          {/* Viewport rect */}
          <div
            className="absolute border-2 border-primary/70 bg-primary/10 rounded-sm"
            style={{
              left: Math.max(0, vpRect.x),
              top: Math.max(0, vpRect.y),
              width: Math.min(vpRect.w, MINI_W - Math.max(0, vpRect.x)),
              height: Math.min(vpRect.h, MINI_H - Math.max(0, vpRect.y)),
            }}
          />
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
