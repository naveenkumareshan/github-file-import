import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { getImageUrl, cn } from '@/lib/utils';

export interface ViewerBed {
  id: string;
  bed_number: number;
  position_x: number;
  position_y: number;
  is_available: boolean;
  is_blocked: boolean;
  category: string | null;
  price_override: number | null;
  sharingType?: string;
  sharingPrice?: number;
  occupantName?: string;
  conflictingBookings?: any[];
}

interface HostelBedPlanViewerProps {
  beds: ViewerBed[];
  roomWidth: number;
  roomHeight: number;
  onBedSelect?: (bed: ViewerBed) => void;
  selectedBed?: ViewerBed | null;
  layoutImage?: string | null;
  layoutImageOpacity?: number;
}

export const HostelBedPlanViewer: React.FC<HostelBedPlanViewerProps> = ({
  beds, roomWidth, roomHeight, onBedSelect, selectedBed, layoutImage, layoutImageOpacity = 30,
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const timer = setTimeout(handleFitToScreen, 100);
    return () => clearTimeout(timer);
  }, [handleFitToScreen]);

  const handleMouseDown = (e: React.MouseEvent) => { setIsPanning(true); setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y }); };
  const handleMouseMove = (e: React.MouseEvent) => { if (!isPanning) return; setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); };
  const handleMouseUp = () => setIsPanning(false);

  const resolvedLayoutImage = layoutImage ? getImageUrl(layoutImage) : null;

  const MINI_W = 120;
  const MINI_H = 90;
  const miniScale = Math.min(MINI_W / roomWidth, MINI_H / roomHeight);
  const vpRect = {
    x: Math.max(0, (-pan.x / zoom) * miniScale),
    y: Math.max(0, (-pan.y / zoom) * miniScale),
    w: containerSize.w > 0 ? (containerSize.w / zoom) * miniScale : MINI_W,
    h: containerSize.h > 0 ? (containerSize.h / zoom) * miniScale : MINI_H,
  };

  return (
    <div>
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-muted/30 h-[60vh] border rounded-lg"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute top-2 right-2 z-30 flex items-center gap-0.5 bg-background/70 backdrop-blur-sm rounded-md border border-border/50 px-1 py-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomOut}><ZoomOut className="h-3 w-3" /></Button>
          <span className="text-[10px] w-8 text-center font-medium">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleZoomIn}><ZoomIn className="h-3 w-3" /></Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleFitToScreen}><Maximize className="h-3 w-3" /></Button>
        </div>

        <div
          className="absolute bg-background rounded shadow-sm"
          style={{
            width: roomWidth, height: roomHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {resolvedLayoutImage && (
            <img src={resolvedLayoutImage} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{ opacity: layoutImageOpacity / 100, zIndex: 0 }} />
          )}

          <TooltipProvider>
            {beds.map(bed => {
              const isSelected = selectedBed?.id === bed.id;
              const isBlocked = bed.is_blocked;
              const isOccupied = !bed.is_available && !isBlocked;

              let bedClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100 cursor-pointer';
              if (isSelected) bedClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/50 cursor-pointer';
              else if (isBlocked) bedClass = 'bg-destructive/10 border-destructive/30 text-destructive cursor-not-allowed';
              else if (isOccupied) bedClass = 'bg-blue-50 border-blue-400 text-blue-800 cursor-not-allowed';

              return (
                <Tooltip key={bed.id}>
                  <TooltipTrigger asChild>
                    <button
                      className={`absolute flex flex-col items-center justify-center rounded border text-[9px] font-bold transition-all ${bedClass}`}
                      style={{
                        left: bed.position_x - 20, top: bed.position_y - 15,
                        width: 40, height: 30, zIndex: isSelected ? 20 : 10,
                      }}
                      onClick={e => { e.stopPropagation(); if (onBedSelect) onBedSelect(bed); }}
                    >
                      <span>{bed.bed_number}</span>
                      {bed.category && <span className="text-[7px] font-normal opacity-70">{bed.category}</span>}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold">Bed #{bed.bed_number}</p>
                      {bed.sharingType && <p>Type: {bed.sharingType}</p>}
                      {bed.category && <p>Category: {bed.category}</p>}
                      <p>Price: {formatCurrency(bed.price_override ?? bed.sharingPrice ?? 0)}/mo</p>
                      <p>{isBlocked ? '🚫 Blocked' : isOccupied ? '👤 Occupied' : '✅ Available'}</p>
                      {bed.occupantName && <p>Guest: {bed.occupantName}</p>}
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
          onMouseDown={e => e.stopPropagation()}
        >
          {beds.map(bed => {
            const mx = bed.position_x * miniScale;
            const my = bed.position_y * miniScale;
            const isSelected = selectedBed?.id === bed.id;
            const dotColor = isSelected ? 'bg-primary' : bed.is_blocked ? 'bg-destructive' : bed.is_available ? 'bg-emerald-500' : 'bg-blue-500';
            return <div key={bed.id} className={`absolute rounded-full ${dotColor}`} style={{ left: mx - 1.5, top: my - 1.5, width: 3, height: 3 }} />;
          })}
          <div className="absolute border-2 border-primary/70 bg-primary/10 rounded-sm" style={{
            left: Math.max(0, vpRect.x), top: Math.max(0, vpRect.y),
            width: Math.min(vpRect.w, MINI_W - Math.max(0, vpRect.x)),
            height: Math.min(vpRect.h, MINI_H - Math.max(0, vpRect.y)),
          }} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 text-[11px] mt-2">
        <div className="flex items-center gap-1"><div className="w-3 h-2.5 rounded border border-emerald-400 bg-emerald-50" /><span>Available</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-2.5 rounded border border-primary bg-primary" /><span>Selected</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-2.5 rounded border border-blue-400 bg-blue-50" /><span>Occupied</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-2.5 rounded border border-destructive/30 bg-destructive/10" /><span>Blocked</span></div>
      </div>
    </div>
  );
};
