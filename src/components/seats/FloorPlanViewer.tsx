import React, { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  TooltipProvider, Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { format } from 'date-fns';
import { getImageUrl, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

/* ─── types ─── */
interface ViewerSeat {
  _id: string;
  id: string;
  number: number;
  price: number;
  position: { x: number; y: number };
  isAvailable: boolean;
  isFutureBooked?: boolean;
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

/* ─── helpers ─── */
const SEAT_BASE_W = 32;
const SEAT_BASE_H = 22;
const PAD = 30; // padding around seat bounding box

const getTouchDistance = (t: React.TouchEvent) => {
  const [a, b] = [t.touches[0], t.touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
};
const getTouchCenter = (t: React.TouchEvent) => {
  const [a, b] = [t.touches[0], t.touches[1]];
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
};

/* ─── seat button (memoized) ─── */
interface SeatButtonProps {
  seat: ViewerSeat;
  isSelected: boolean;
  onSelect?: (seat: ViewerSeat) => void;
  seatW: number;
  seatH: number;
}

const MemoizedSeatButton = memo(({ seat, isSelected, onSelect, seatW, seatH }: SeatButtonProps) => {
  const isBooked = !seat.isAvailable;
  const isFutureBooked = seat.isFutureBooked && !isBooked;
  let seatClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100 cursor-pointer';
  if (isSelected) seatClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/50 cursor-pointer';
  else if (isBooked) seatClass = 'bg-muted border-muted-foreground/30 text-muted-foreground cursor-not-allowed';
  else if (isFutureBooked) seatClass = 'bg-violet-50 border-violet-400 text-violet-800 hover:bg-violet-100 cursor-pointer';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={`absolute flex items-center justify-center rounded border font-bold transition-all ${seatClass}`}
          style={{
            left: seat.position.x,
            top: seat.position.y,
            width: seatW,
            height: seatH,
            fontSize: Math.max(8, seatW * 0.28),
            zIndex: isSelected ? 20 : 10,
          }}
          onClick={e => {
            e.stopPropagation();
            if (seat.isAvailable && onSelect) onSelect(seat);
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
          <p>{seat.isAvailable ? (seat.isFutureBooked ? '🟣 Future Booked' : '✅ Available') : '❌ Booked'}</p>
          {!seat.isAvailable && seat.unavailableUntil && (
            <p>Until: {format(new Date(seat.unavailableUntil), 'dd MMM yyyy')}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}, (prev, next) =>
  prev.seat._id === next.seat._id &&
  prev.seat.isAvailable === next.seat.isAvailable &&
  prev.seat.isFutureBooked === next.seat.isFutureBooked &&
  prev.isSelected === next.isSelected &&
  prev.seat.price === next.seat.price &&
  prev.seatW === next.seatW &&
  prev.seatH === next.seatH
);

MemoizedSeatButton.displayName = 'MemoizedSeatButton';

/* ─── main component ─── */
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
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const fitScaleRef = useRef(1);

  // Responsive seat dimensions
  const seatScale = isMobile ? 1.05 : 1.0;
  const seatW = Math.round(SEAT_BASE_W * seatScale);
  const seatH = Math.round(SEAT_BASE_H * seatScale);

  // Tight bounding box of all seats
  const bounds = useMemo(() => {
    if (seats.length === 0) return { x: 0, y: 0, w: roomWidth, h: roomHeight };
    const halfW = seatW / 2;
    const halfH = seatH / 2;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of seats) {
      minX = Math.min(minX, s.position.x - halfW);
      minY = Math.min(minY, s.position.y - halfH);
      maxX = Math.max(maxX, s.position.x + halfW);
      maxY = Math.max(maxY, s.position.y + halfH);
    }
    return {
      x: minX - PAD,
      y: minY - PAD,
      w: maxX - minX + PAD * 2,
      h: maxY - minY + PAD * 2,
    };
  }, [seats, seatW, seatH, roomWidth, roomHeight]);

  // Clamp helper
  const clampZoom = useCallback((z: number) => Math.min(Math.max(z, fitScaleRef.current), 3), []);

  // Fit-to-screen: compute scale from bounds, apply 1.15x boost, center
  const handleFitToScreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    if (cw === 0 || ch === 0) return;

    const fitScale = Math.min(cw / bounds.w, ch / bounds.h);
    fitScaleRef.current = fitScale;
    const newZoom = Math.min(fitScale * 1.15, 3);

    // Center the bounding box
    const panX = (cw - bounds.w * newZoom) / 2 - bounds.x * newZoom;
    const panY = (ch - bounds.h * newZoom) / 2 - bounds.y * newZoom;

    setZoom(newZoom);
    setPan({ x: panX, y: panY });
  }, [bounds]);

  // Zoom buttons
  const handleZoomIn = () => setZoom(z => clampZoom(z + 0.25));
  const handleZoomOut = () => setZoom(z => clampZoom(z - 0.25));

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

  // Auto-fit on mount + when seats change
  useEffect(() => {
    const timer = setTimeout(handleFitToScreen, 100);
    return () => clearTimeout(timer);
  }, [handleFitToScreen, seats.length]);

  // ─── Mouse handlers ───
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };
  const handleMouseUp = () => setIsPanning(false);

  // ─── Scroll-wheel zoom (desktop) ───
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    setZoom(prevZoom => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = clampZoom(prevZoom + delta);
      const scale = newZoom / prevZoom;
      setPan(p => ({
        x: cursorX - (cursorX - p.x) * scale,
        y: cursorY - (cursorY - p.y) * scale,
      }));
      return newZoom;
    });
  }, [clampZoom]);

  // ─── Touch handlers (pan + pinch-to-zoom) ───
  const touchRef = useRef<{
    panX: number; panY: number;
    startX: number; startY: number;
    dist: number; zoom: number;
    fingers: number;
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchRef.current = { startX: t.clientX, startY: t.clientY, panX: pan.x, panY: pan.y, dist: 0, zoom, fingers: 1 };
      setIsPanning(true);
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e);
      touchRef.current = { startX: 0, startY: 0, panX: pan.x, panY: pan.y, dist, zoom, fingers: 2 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!touchRef.current) return;

    if (e.touches.length === 1 && touchRef.current.fingers === 1) {
      const t = e.touches[0];
      setPan({
        x: touchRef.current.panX + (t.clientX - touchRef.current.startX),
        y: touchRef.current.panY + (t.clientY - touchRef.current.startY),
      });
    } else if (e.touches.length === 2) {
      if (touchRef.current.fingers === 1) {
        // switched from 1→2 fingers: re-init pinch
        touchRef.current = { startX: 0, startY: 0, panX: pan.x, panY: pan.y, dist: getTouchDistance(e), zoom, fingers: 2 };
        return;
      }
      const newDist = getTouchDistance(e);
      const scale = newDist / touchRef.current.dist;
      const newZoom = clampZoom(touchRef.current.zoom * scale);

      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const center = getTouchCenter(e);
        const cx = center.x - rect.left;
        const cy = center.y - rect.top;
        const zoomRatio = newZoom / touchRef.current.zoom;
        setPan({
          x: cx - (cx - touchRef.current.panX) * zoomRatio,
          y: cy - (cy - touchRef.current.panY) * zoomRatio,
        });
      }
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
    setIsPanning(false);
  };

  // ─── Minimap ───
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
    const roomX = (e.clientX - rect.left) / miniScale;
    const roomY = (e.clientY - rect.top) / miniScale;
    setPan({
      x: -(roomX * zoom - containerSize.w / 2),
      y: -(roomY * zoom - containerSize.h / 2),
    });
  };

  const resolvedLayoutImage = layoutImage ? getImageUrl(layoutImage) : null;
  const isStudentView = layoutImageOpacity >= 100;

  return (
    <div>
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden bg-muted/30 min-h-[350px] touch-none",
          isStudentView ? "h-[70vh]" : "h-[60vh] border rounded-lg"
        )}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Zoom controls */}
        <div className="absolute top-2 right-2 z-30 flex items-center gap-0.5 bg-background/70 backdrop-blur-sm rounded-md border border-border/50 px-1 py-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomOut}><ZoomOut className="h-3 w-3" /></Button>
          <span className="text-[10px] w-8 text-center font-medium">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomIn}><ZoomIn className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleFitToScreen}><Maximize className="h-3 w-3" /></Button>
        </div>

        {/* Seat canvas */}
        <div
          className="absolute bg-background rounded shadow-sm"
          style={{
            width: roomWidth,
            height: roomHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          {resolvedLayoutImage && (
            <img
              src={resolvedLayoutImage}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ opacity: layoutImageOpacity / 100, zIndex: 0 }}
            />
          )}

          <TooltipProvider>
            {seats.map(seat => (
              <MemoizedSeatButton
                key={seat._id}
                seat={seat}
                isSelected={selectedSeat?._id === seat._id}
                onSelect={onSeatSelect}
                seatW={seatW}
                seatH={seatH}
              />
            ))}
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
          {seats.map(seat => {
            const mx = seat.position.x * miniScale;
            const my = seat.position.y * miniScale;
            const isSelected = selectedSeat?._id === seat._id;
            const dotColor = isSelected
              ? 'bg-primary'
              : !seat.isAvailable
                ? 'bg-muted-foreground/50'
                : seat.isFutureBooked
                  ? 'bg-violet-500'
                  : 'bg-emerald-500';
            return (
              <div
                key={seat._id}
                className={`absolute rounded-full ${dotColor}`}
                style={{ left: mx - 1.5, top: my - 1.5, width: 3, height: 3 }}
              />
            );
          })}
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
      <div className="flex items-center justify-center gap-3 text-[11px] mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded border border-emerald-400 bg-emerald-50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded border border-violet-400 bg-violet-50" />
          <span>Future Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded border border-primary bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-2.5 rounded border border-muted-foreground/30 bg-muted" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
};
