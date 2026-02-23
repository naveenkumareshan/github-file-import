import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Save, ZoomIn, ZoomOut, Maximize, Image, X, MousePointerClick,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
export interface FloorPlanSeat {
  _id: string;
  id: string;
  number: number;
  cabinId: string;
  price: number;
  position: { x: number; y: number };
  isAvailable: boolean;
  isHotSelling: boolean;
  unavailableUntil?: string;
  rowIndex?: number;
  colIndex?: number;
  sectionId?: string;
  category?: string;
}

interface FloorPlanDesignerProps {
  cabinId: string;
  roomWidth: number;
  roomHeight: number;
  seats: FloorPlanSeat[];
  onSeatsChange: (seats: FloorPlanSeat[]) => void;
  onSeatSelect: (seat: FloorPlanSeat | null) => void;
  selectedSeat: FloorPlanSeat | null;
  onSave: () => void;
  onDeleteSeat?: (seatId: string) => void;
  onPlaceSeat?: (position: { x: number; y: number }, number: number, price: number, category: string) => void;
  layoutImage?: string | null;
  layoutImageOpacity?: number;
  onLayoutImageChange?: (image: string | null) => void;
  onLayoutImageOpacityChange?: (opacity: number) => void;
  isSaving?: boolean;
}

const SEAT_CATEGORIES = ['AC', 'Non-AC', 'Premium', 'Economy'] as const;

export const FloorPlanDesigner: React.FC<FloorPlanDesignerProps> = ({
  cabinId,
  roomWidth,
  roomHeight,
  seats,
  onSeatsChange,
  onSeatSelect,
  selectedSeat,
  onSave,
  onDeleteSeat,
  onPlaceSeat,
  layoutImage,
  layoutImageOpacity = 30,
  onLayoutImageChange,
  onLayoutImageOpacityChange,
  isSaving,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Placement mode
  const [placementMode, setPlacementMode] = useState(false);
  const [nextSeatNumber, setNextSeatNumber] = useState(1);

  // Pending seat for dialog
  const [pendingSeat, setPendingSeat] = useState<{ x: number; y: number } | null>(null);

  // Update nextSeatNumber when seats change
  useEffect(() => {
    if (seats.length > 0) {
      const maxNum = Math.max(...seats.map(s => s.number));
      setNextSeatNumber(maxNum + 1);
    } else {
      setNextSeatNumber(1);
    }
  }, [seats.length]);

  // ── Canvas coordinate helpers ──
  const getCanvasPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // ── Canvas mouse handlers ──
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Placement mode: show dialog instead of immediate creation
    if (placementMode && onPlaceSeat) {
      const pos = getCanvasPos(e);
      if (pos.x >= 0 && pos.y >= 0 && pos.x <= roomWidth && pos.y <= roomHeight) {
        setPendingSeat({ x: Math.round(pos.x), y: Math.round(pos.y) });
      }
      return;
    }

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  useEffect(() => {
    const handler = () => setIsPanning(false);
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, []);

  // ── Layout image upload ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLayoutImageChange) return;
    const reader = new FileReader();
    reader.onload = () => onLayoutImageChange(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Zoom ──
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const handleFitToScreen = () => {
    if (!canvasRef.current?.parentElement) return;
    const container = canvasRef.current.parentElement;
    const scaleX = (container.clientWidth - 40) / roomWidth;
    const scaleY = (container.clientHeight - 40) / roomHeight;
    setZoom(Math.min(scaleX, scaleY, 1.5));
    setPan({ x: 20, y: 20 });
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.25, Math.min(z + (e.deltaY > 0 ? -0.1 : 0.1), 3)));
  };

  // ── Seat placement confirm ──
  const handlePlacementConfirm = (number: number, category: string, price: number) => {
    if (pendingSeat && onPlaceSeat) {
      onPlaceSeat(pendingSeat, number, price, category);
      setNextSeatNumber(number + 1);
    }
    setPendingSeat(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border">
        {/* Upload layout image */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        {layoutImage ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">Opacity:</Label>
              <Slider
                className="w-20"
                min={5} max={80} step={5}
                value={[layoutImageOpacity]}
                onValueChange={([v]) => onLayoutImageOpacityChange?.(v)}
              />
              <span className="text-xs w-8">{layoutImageOpacity}%</span>
            </div>
            <Button variant="outline" size="sm" className="h-8" onClick={() => onLayoutImageChange?.(null)}>
              <X className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="h-8" onClick={() => fileInputRef.current?.click()}>
            <Image className="h-3.5 w-3.5 mr-1" /> Upload Layout
          </Button>
        )}

        <div className="h-6 w-px bg-border" />

        {/* Place Seats toggle */}
        <Button
          variant={placementMode ? 'default' : 'outline'}
          size="sm"
          className="h-8"
          onClick={() => setPlacementMode(!placementMode)}
        >
          <MousePointerClick className="h-3.5 w-3.5 mr-1" /> {placementMode ? 'Stop Placing' : 'Place Seats'}
        </Button>

        {placementMode && (
          <span className="text-xs text-muted-foreground">Next: #{nextSeatNumber} — Click on the layout to place a seat</span>
        )}

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFitToScreen}><Maximize className="h-3.5 w-3.5" /></Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button size="sm" className="h-8" onClick={onSave} disabled={isSaving}>
          <Save className="h-3.5 w-3.5 mr-1" /> {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>

      {/* Canvas */}
      <div
        className="relative overflow-hidden border rounded-lg bg-muted/30"
        style={{ height: '600px', cursor: placementMode ? 'crosshair' : (isPanning ? 'grabbing' : 'grab') }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleWheel}
      >
        <div
          ref={canvasRef}
          className="absolute bg-background rounded shadow-sm"
          style={{
            width: roomWidth,
            height: roomHeight,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Background layout image */}
          {layoutImage && (
            <img
              src={layoutImage}
              alt="Layout background"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ opacity: layoutImageOpacity / 100, zIndex: 0 }}
            />
          )}

          {/* Render all seats */}
          {seats.map(seat => {
            const isSelected = selectedSeat?._id === seat._id;
            const isBooked = !seat.isAvailable;

            let seatClass = 'bg-emerald-50 border-emerald-400 text-emerald-800';
            if (isSelected) seatClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/50';
            else if (isBooked) seatClass = 'bg-muted border-muted-foreground/30 text-muted-foreground';

            return (
              <div key={seat._id} className="group absolute" style={{
                left: seat.position.x - 18,
                top: seat.position.y - 13,
                zIndex: isSelected ? 20 : 5,
              }}>
                <button
                  className={`flex items-center justify-center rounded border text-[10px] font-bold select-none transition-all ${seatClass}`}
                  style={{ width: 36, height: 26 }}
                  onClick={e => {
                    e.stopPropagation();
                    onSeatSelect(isSelected ? null : seat);
                  }}
                >
                  {seat.number}
                </button>
                {onDeleteSeat && (
                  <button
                    className="absolute -top-2 -right-2 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[8px]"
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteSeat(seat._id);
                    }}
                    title="Delete seat"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
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
          <span>Booked/Blocked</span>
        </div>
      </div>

      {/* Seat Placement Dialog */}
      <SeatPlacementDialog
        open={!!pendingSeat}
        defaultNumber={nextSeatNumber}
        defaultPrice={2000}
        onConfirm={handlePlacementConfirm}
        onCancel={() => setPendingSeat(null)}
      />
    </div>
  );
};

// ── Seat Placement Dialog ──────────────────────────────────────────
interface SeatPlacementDialogProps {
  open: boolean;
  defaultNumber: number;
  defaultPrice: number;
  onConfirm: (number: number, category: string, price: number) => void;
  onCancel: () => void;
}

const SeatPlacementDialog: React.FC<SeatPlacementDialogProps> = ({
  open,
  defaultNumber,
  defaultPrice,
  onConfirm,
  onCancel,
}) => {
  const [seatNumber, setSeatNumber] = useState(defaultNumber);
  const [category, setCategory] = useState('Non-AC');
  const [price, setPrice] = useState(defaultPrice);

  useEffect(() => {
    if (open) {
      setSeatNumber(defaultNumber);
      setPrice(defaultPrice);
    }
  }, [open, defaultNumber, defaultPrice]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Place Seat</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div>
            <Label>Seat Number</Label>
            <Input type="number" min={1} value={seatNumber} onChange={e => setSeatNumber(+e.target.value || 1)} />
          </div>
          <div>
            <Label>Category</Label>
            <RadioGroup value={category} onValueChange={setCategory} className="flex flex-wrap gap-3 mt-2">
              {SEAT_CATEGORIES.map(cat => (
                <div key={cat} className="flex items-center space-x-1.5">
                  <RadioGroupItem value={cat} id={`cat-${cat}`} />
                  <Label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">{cat}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label>Price (₹/month)</Label>
            <Input type="number" min={0} value={price} onChange={e => setPrice(+e.target.value || 0)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(seatNumber, category, price)}>Place Seat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
