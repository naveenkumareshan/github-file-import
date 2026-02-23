import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DoorOpen, ToiletIcon, Wind, MonitorPlay, AirVent,
  Save, RotateCw, Trash2, Grid3X3, ZoomIn, ZoomOut, Maximize,
  Plus, GripHorizontal,
} from 'lucide-react';
import { GridOverlay } from './GridOverlay';
import { RoomWalls } from './RoomWalls';
import { AutoSeatGenerator, GeneratedSeat } from './AutoSeatGenerator';

export interface RoomElement {
  id: string;
  type: 'door' | 'bath' | 'window' | 'screen' | 'AC';
  position: { x: number; y: number };
  rotation?: number;
}

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
}

interface FloorPlanDesignerProps {
  cabinId: string;
  roomWidth: number;
  roomHeight: number;
  gridSize: number;
  seats: FloorPlanSeat[];
  roomElements: RoomElement[];
  onRoomDimensionsChange: (w: number, h: number, g: number) => void;
  onSeatsChange: (seats: FloorPlanSeat[]) => void;
  onRoomElementsChange: (elements: RoomElement[]) => void;
  onSeatSelect: (seat: FloorPlanSeat | null) => void;
  selectedSeat: FloorPlanSeat | null;
  onSave: () => void;
  onBulkCreateSeats: (seats: GeneratedSeat[]) => void;
  isSaving?: boolean;
}

const ELEMENT_ICONS: Record<string, React.ElementType> = {
  door: DoorOpen,
  bath: ToiletIcon,
  window: Wind,
  screen: MonitorPlay,
  AC: AirVent,
};

const ELEMENT_LABELS: Record<string, string> = {
  door: 'Door', bath: 'Bath', window: 'Window', screen: 'Screen', AC: 'AC',
};

export const FloorPlanDesigner: React.FC<FloorPlanDesignerProps> = ({
  cabinId,
  roomWidth,
  roomHeight,
  gridSize,
  seats,
  roomElements,
  onRoomDimensionsChange,
  onSeatsChange,
  onRoomElementsChange,
  onSeatSelect,
  selectedSeat,
  onSave,
  onBulkCreateSeats,
  isSaving,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ type: 'seat' | 'element'; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAutoGen, setShowAutoGen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const snap = useCallback((val: number) => Math.round(val / gridSize) * gridSize, [gridSize]);

  const clamp = useCallback((x: number, y: number, itemW: number, itemH: number) => ({
    x: Math.max(gridSize, Math.min(snap(x), roomWidth - itemW - gridSize)),
    y: Math.max(gridSize, Math.min(snap(y), roomHeight - itemH - gridSize)),
  }), [gridSize, roomWidth, roomHeight, snap]);

  // Wall constraint for elements
  const constrainToWall = useCallback((type: string, x: number, y: number) => {
    const pos = { x: snap(x), y: snap(y) };
    const wallThreshold = gridSize * 2;

    if (type === 'door' || type === 'window') {
      // Snap to nearest wall
      const distLeft = pos.x;
      const distRight = roomWidth - pos.x;
      const distTop = pos.y;
      const distBottom = roomHeight - pos.y;
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      if (minDist === distLeft) pos.x = gridSize;
      else if (minDist === distRight) pos.x = roomWidth - gridSize * 4;
      else if (minDist === distTop) pos.y = gridSize;
      else pos.y = roomHeight - gridSize * 2;
    } else if (type === 'screen') {
      pos.y = gridSize; // Front wall only
    } else if (type === 'AC') {
      pos.y = gridSize; // Top wall
    } else if (type === 'bath') {
      // Corner or wall
      const distLeft = pos.x;
      const distRight = roomWidth - pos.x;
      const distTop = pos.y;
      const distBottom = roomHeight - pos.y;
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);
      if (minDist === distLeft) pos.x = gridSize;
      else if (minDist === distRight) pos.x = roomWidth - gridSize * 4;
      if (minDist === distTop) pos.y = gridSize;
      else if (minDist === distBottom) pos.y = roomHeight - gridSize * 3;
    }
    return pos;
  }, [gridSize, roomWidth, roomHeight, snap]);

  const handleAddElement = (type: RoomElement['type']) => {
    const pos = constrainToWall(type, roomWidth / 2, roomHeight / 2);
    const newElement: RoomElement = {
      id: `${type}-${Date.now()}`,
      type,
      position: pos,
      rotation: 0,
    };
    onRoomElementsChange([...roomElements, newElement]);
    setIsDirty(true);
  };

  const handleRotateElement = (id: string) => {
    onRoomElementsChange(roomElements.map(el =>
      el.id === id ? { ...el, rotation: ((el.rotation || 0) + 90) % 360 } : el
    ));
    setIsDirty(true);
  };

  const handleRemoveElement = (id: string) => {
    onRoomElementsChange(roomElements.filter(el => el.id !== id));
    setIsDirty(true);
  };

  // --- Mouse handlers for dragging ---
  const getCanvasPos = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  const handleMouseDown = (e: React.MouseEvent, type: 'seat' | 'element', id: string, itemPos: { x: number; y: number }) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getCanvasPos(e);
    setDragging({ type, id });
    setDragOffset({ x: pos.x - itemPos.x, y: pos.y - itemPos.y });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (dragging) return;
    // Start panning
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && !dragging) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (!dragging) return;

    const pos = getCanvasPos(e);
    const newX = pos.x - dragOffset.x;
    const newY = pos.y - dragOffset.y;

    if (dragging.type === 'seat') {
      const clamped = clamp(newX, newY, 36, 26);
      // Check overlap
      const hasOverlap = seats.some(s =>
        s._id !== dragging.id &&
        Math.abs(s.position.x - clamped.x) < 36 &&
        Math.abs(s.position.y - clamped.y) < 26
      );

      onSeatsChange(seats.map(s =>
        s._id === dragging.id ? { ...s, position: clamped } : s
      ));

      if (hasOverlap) {
        // Visual feedback could be added here
      }
      setIsDirty(true);
    } else {
      const element = roomElements.find(el => el.id === dragging.id);
      if (element) {
        const constrained = constrainToWall(element.type, newX, newY);
        onRoomElementsChange(roomElements.map(el =>
          el.id === dragging.id ? { ...el, position: constrained } : el
        ));
        setIsDirty(true);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDragging(null);
    setIsPanning(false);
  };

  useEffect(() => {
    const handler = () => { setDragging(null); setIsPanning(false); };
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, []);

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.25));
  const handleFitToScreen = () => {
    if (!canvasRef.current?.parentElement) return;
    const container = canvasRef.current.parentElement;
    const scaleX = (container.clientWidth - 40) / roomWidth;
    const scaleY = (container.clientHeight - 40) / roomHeight;
    const newZoom = Math.min(scaleX, scaleY, 1.5);
    setZoom(newZoom);
    setPan({ x: 20, y: 20 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.25, Math.min(z + delta, 3)));
  };

  const handleAutoGenerate = (generatedSeats: GeneratedSeat[]) => {
    onBulkCreateSeats(generatedSeats);
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave();
    setIsDirty(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border">
        {/* Room dimensions */}
        <div className="flex items-center gap-1.5">
          <Label className="text-xs whitespace-nowrap">W:</Label>
          <Input
            type="number"
            className="w-20 h-8 text-xs"
            value={roomWidth}
            min={400} max={1600} step={20}
            onChange={e => onRoomDimensionsChange(+e.target.value || 800, roomHeight, gridSize)}
          />
          <Label className="text-xs whitespace-nowrap">H:</Label>
          <Input
            type="number"
            className="w-20 h-8 text-xs"
            value={roomHeight}
            min={300} max={1200} step={20}
            onChange={e => onRoomDimensionsChange(roomWidth, +e.target.value || 600, gridSize)}
          />
          <Label className="text-xs whitespace-nowrap">Grid:</Label>
          <Input
            type="number"
            className="w-16 h-8 text-xs"
            value={gridSize}
            min={10} max={40} step={10}
            onChange={e => onRoomDimensionsChange(roomWidth, roomHeight, +e.target.value || 20)}
          />
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Grid toggle */}
        <Button variant={showGrid ? 'default' : 'outline'} size="sm" className="h-8" onClick={() => setShowGrid(!showGrid)}>
          <Grid3X3 className="h-3.5 w-3.5 mr-1" /> Grid
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Element buttons */}
        {(['door', 'bath', 'window', 'screen', 'AC'] as const).map(type => {
          const Icon = ELEMENT_ICONS[type];
          return (
            <Button key={type} variant="outline" size="sm" className="h-8" onClick={() => handleAddElement(type)}>
              <Icon className="h-3.5 w-3.5 mr-1" /> {ELEMENT_LABELS[type]}
            </Button>
          );
        })}

        <div className="h-6 w-px bg-border" />

        {/* Auto generate */}
        <Button variant="outline" size="sm" className="h-8" onClick={() => setShowAutoGen(true)}>
          <Grid3X3 className="h-3.5 w-3.5 mr-1" /> Auto Generate
        </Button>

        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn}><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFitToScreen}><Maximize className="h-3.5 w-3.5" /></Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Save */}
        <Button size="sm" className="h-8" onClick={handleSave} disabled={isSaving}>
          <Save className="h-3.5 w-3.5 mr-1" /> {isSaving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>

      {/* Canvas */}
      <div
        className="relative overflow-hidden border rounded-lg bg-muted/30"
        style={{ height: '600px', cursor: isPanning ? 'grabbing' : 'grab' }}
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
          {/* Room walls */}
          <RoomWalls width={roomWidth} height={roomHeight} />

          {/* Grid overlay */}
          <GridOverlay width={roomWidth} height={roomHeight} gridSize={gridSize} visible={showGrid} />

          {/* Room elements */}
          <TooltipProvider>
            {roomElements.map(element => {
              const Icon = ELEMENT_ICONS[element.type];
              return (
                <div
                  key={element.id}
                  className="absolute flex items-center gap-1 px-2 py-1 rounded bg-background border shadow-sm text-xs font-medium select-none"
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    cursor: dragging?.id === element.id ? 'grabbing' : 'grab',
                    zIndex: dragging?.id === element.id ? 50 : 10,
                    transform: `rotate(${element.rotation || 0}deg)`,
                    transformOrigin: 'center',
                  }}
                  onMouseDown={e => handleMouseDown(e, 'element', element.id, element.position)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{ELEMENT_LABELS[element.type]}</span>
                  <div className="flex gap-0.5 ml-1">
                    <button
                      className="p-0.5 hover:bg-muted rounded"
                      onClick={e => { e.stopPropagation(); handleRotateElement(element.id); }}
                    >
                      <RotateCw className="h-3 w-3" />
                    </button>
                    <button
                      className="p-0.5 hover:bg-destructive/10 rounded text-destructive"
                      onClick={e => { e.stopPropagation(); handleRemoveElement(element.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Seats */}
            {seats.map(seat => {
              const isSelected = selectedSeat?._id === seat._id;
              const isBooked = !seat.isAvailable;

              let bgClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-700';
              if (isSelected) bgClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/50';
              else if (isBooked) bgClass = 'bg-destructive/15 border-destructive/40 text-destructive';

              return (
                <Tooltip key={seat._id}>
                  <TooltipTrigger asChild>
                    <button
                      className={`absolute flex items-center justify-center rounded border text-[11px] font-bold select-none transition-all ${bgClass}`}
                      style={{
                        left: seat.position.x,
                        top: seat.position.y,
                        width: 36,
                        height: 26,
                        cursor: dragging?.id === seat._id ? 'grabbing' : 'grab',
                        zIndex: dragging?.id === seat._id ? 50 : (isSelected ? 20 : 5),
                      }}
                      onMouseDown={e => handleMouseDown(e, 'seat', seat._id, seat.position)}
                      onClick={e => {
                        e.stopPropagation();
                        onSeatSelect(isSelected ? null : seat);
                      }}
                    >
                      {seat.number}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      <p className="font-bold">Seat {seat.number}</p>
                      <p>₹{seat.price}/month</p>
                      <p>{seat.isAvailable ? 'Available' : 'Booked/Blocked'}</p>
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
          <span>Booked/Blocked</span>
        </div>
      </div>

      {/* Auto seat generator dialog */}
      <AutoSeatGenerator
        open={showAutoGen}
        onOpenChange={setShowAutoGen}
        onGenerate={handleAutoGenerate}
        roomWidth={roomWidth}
        roomHeight={roomHeight}
        gridSize={gridSize}
        existingSeatCount={seats.length}
      />
    </div>
  );
};
