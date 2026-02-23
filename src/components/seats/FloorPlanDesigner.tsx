import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Save, Grid3X3, ZoomIn, ZoomOut, Maximize, Plus, LayoutGrid,
  Trash2, GripHorizontal, Building2, Edit, DoorOpen, Wind, Monitor,
  Snowflake, Bath, ChevronDown, Image, X, MousePointerClick,
} from 'lucide-react';
import { RoomWalls } from './RoomWalls';
import { GridOverlay } from './GridOverlay';

// ── Types ──────────────────────────────────────────────────────────
export interface Section {
  id: string;
  name: string;
  type: 'seats' | 'structural';
  position: { x: number; y: number };
  width: number;
  height: number;
  rows?: number;
  cols?: number;
  aisleAfterCol?: number;
  seatSpacing?: number;
  price?: number;
  structuralLabel?: string;
  color?: string;
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
  sectionId?: string;
}

export interface RoomElement {
  id: string;
  type: 'door' | 'bath' | 'window' | 'screen' | 'AC';
  position: { x: number; y: number };
  rotation?: number;
}

interface FloorPlanDesignerProps {
  cabinId: string;
  roomWidth: number;
  roomHeight: number;
  gridSize: number;
  seats: FloorPlanSeat[];
  sections: Section[];
  roomElements: RoomElement[];
  onRoomDimensionsChange: (w: number, h: number, g: number) => void;
  onSeatsChange: (seats: FloorPlanSeat[]) => void;
  onSectionsChange: (sections: Section[]) => void;
  onRoomElementsChange: (elements: RoomElement[]) => void;
  onSeatSelect: (seat: FloorPlanSeat | null) => void;
  selectedSeat: FloorPlanSeat | null;
  onSave: () => void;
  onGenerateSeatsForSection: (section: Section) => void;
  onDeleteSeat?: (seatId: string) => void;
  onAddSeatToSection?: (section: Section) => void;
  onDeleteSectionWithSeats?: (sectionId: string) => void;
  onPlaceSeat?: (position: { x: number; y: number }, number: number, price: number) => void;
  layoutImage?: string | null;
  layoutImageOpacity?: number;
  onLayoutImageChange?: (image: string | null) => void;
  onLayoutImageOpacityChange?: (opacity: number) => void;
  isSaving?: boolean;
}

// ── Color themes ──
const SECTION_COLORS: Record<string, { border: string; header: string; seat: string; dot: string }> = {
  blue:    { border: 'border-blue-400',    header: 'bg-blue-100',    seat: 'bg-blue-50 border-blue-400 text-blue-800',    dot: 'bg-blue-400' },
  green:   { border: 'border-emerald-400', header: 'bg-emerald-100', seat: 'bg-emerald-50 border-emerald-400 text-emerald-800', dot: 'bg-emerald-400' },
  purple:  { border: 'border-purple-400',  header: 'bg-purple-100',  seat: 'bg-purple-50 border-purple-400 text-purple-800',  dot: 'bg-purple-400' },
  orange:  { border: 'border-orange-400',  header: 'bg-orange-100',  seat: 'bg-orange-50 border-orange-400 text-orange-800',  dot: 'bg-orange-400' },
  teal:    { border: 'border-teal-400',    header: 'bg-teal-100',    seat: 'bg-teal-50 border-teal-400 text-teal-800',    dot: 'bg-teal-400' },
  rose:    { border: 'border-rose-400',    header: 'bg-rose-100',    seat: 'bg-rose-50 border-rose-400 text-rose-800',    dot: 'bg-rose-400' },
  amber:   { border: 'border-amber-400',   header: 'bg-amber-100',   seat: 'bg-amber-50 border-amber-400 text-amber-800',   dot: 'bg-amber-400' },
  indigo:  { border: 'border-indigo-400',  header: 'bg-indigo-100',  seat: 'bg-indigo-50 border-indigo-400 text-indigo-800',  dot: 'bg-indigo-400' },
};

const STRUCTURAL_COLORS: Record<string, string> = {
  Washroom: 'bg-blue-100 border-blue-300 text-blue-700',
  Office: 'bg-amber-100 border-amber-300 text-amber-700',
  Lockers: 'bg-violet-100 border-violet-300 text-violet-700',
  Storage: 'bg-stone-100 border-stone-300 text-stone-700',
  Custom: 'bg-muted border-border text-muted-foreground',
};

const WALL_ELEMENT_TYPES: { type: RoomElement['type']; label: string; icon: React.ReactNode }[] = [
  { type: 'door', label: 'Door', icon: <DoorOpen className="h-4 w-4" /> },
  { type: 'window', label: 'Window', icon: <Wind className="h-4 w-4" /> },
  { type: 'screen', label: 'Screen', icon: <Monitor className="h-4 w-4" /> },
  { type: 'AC', label: 'AC', icon: <Snowflake className="h-4 w-4" /> },
  { type: 'bath', label: 'Bath', icon: <Bath className="h-4 w-4" /> },
];

const WALL_ELEMENT_STYLES: Record<string, string> = {
  door: 'bg-orange-100 border-orange-400 text-orange-700',
  window: 'bg-sky-100 border-sky-400 text-sky-700',
  screen: 'bg-indigo-100 border-indigo-400 text-indigo-700',
  AC: 'bg-cyan-100 border-cyan-400 text-cyan-700',
  bath: 'bg-teal-100 border-teal-400 text-teal-700',
};

type ResizeHandle = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

interface ResizingState {
  id: string;
  handle: ResizeHandle;
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: 'nw-resize', n: 'n-resize', ne: 'ne-resize',
  w: 'w-resize', e: 'e-resize',
  sw: 'sw-resize', s: 's-resize', se: 'se-resize',
};

export const FloorPlanDesigner: React.FC<FloorPlanDesignerProps> = ({
  cabinId,
  roomWidth,
  roomHeight,
  gridSize,
  seats,
  sections,
  roomElements,
  onRoomDimensionsChange,
  onSeatsChange,
  onSectionsChange,
  onRoomElementsChange,
  onSeatSelect,
  selectedSeat,
  onSave,
  onGenerateSeatsForSection,
  onDeleteSeat,
  onAddSeatToSection,
  onDeleteSectionWithSeats,
  onPlaceSeat,
  layoutImage,
  layoutImageOpacity = 30,
  onLayoutImageChange,
  onLayoutImageOpacityChange,
  isSaving,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Section dragging
  const [draggingSection, setDraggingSection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Section resizing
  const [resizing, setResizing] = useState<ResizingState | null>(null);

  // Wall element dragging
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const [elementDragOffset, setElementDragOffset] = useState({ x: 0, y: 0 });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);

  // Section editor
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showSectionEditor, setShowSectionEditor] = useState(false);

  // Placement mode
  const [placementMode, setPlacementMode] = useState(false);
  const [nextSeatNumber, setNextSeatNumber] = useState(1);
  const [placementPrice, setPlacementPrice] = useState(2000);

  // Update nextSeatNumber when seats change
  useEffect(() => {
    if (seats.length > 0) {
      const maxNum = Math.max(...seats.map(s => s.number));
      setNextSeatNumber(maxNum + 1);
    } else {
      setNextSeatNumber(1);
    }
  }, [seats.length]);

  const snap = useCallback((val: number) => Math.round(val / gridSize) * gridSize, [gridSize]);

  // ── Canvas coordinate helpers ──
  const getCanvasPos = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // ── Section CRUD ──
  const handleAddSeatSection = () => {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      type: 'seats',
      position: { x: snap(40), y: snap(80) },
      width: 400,
      height: 300,
      rows: 5,
      cols: 6,
      aisleAfterCol: 3,
      seatSpacing: 50,
      price: 2000,
      color: 'blue',
    };
    onSectionsChange([...sections, newSection]);
    setEditingSection(newSection);
    setShowSectionEditor(true);
  };

  const handleDeleteSection = (id: string) => {
    if (onDeleteSectionWithSeats) {
      onDeleteSectionWithSeats(id);
    } else {
      onSectionsChange(sections.filter(s => s.id !== id));
      onSeatsChange(seats.filter(s => s.sectionId !== id));
    }
    if (editingSection?.id === id) {
      setEditingSection(null);
      setShowSectionEditor(false);
    }
  };

  const handleUpdateSection = (updated: Section) => {
    // Check if section shrunk — remove out-of-bounds seats
    const sectionSeats = seats.filter(s => s.sectionId === updated.id);
    const outOfBounds = sectionSeats.filter(seat => {
      const relX = seat.position.x - updated.position.x;
      const relY = seat.position.y - updated.position.y;
      return relX + 36 > updated.width - 5 || relY + 26 > updated.height - 5 || relX < 0 || relY < 28;
    });

    if (outOfBounds.length > 0) {
      outOfBounds.forEach(seat => {
        if (onDeleteSeat) onDeleteSeat(seat._id);
      });
      const outIds = new Set(outOfBounds.map(s => s._id));
      onSeatsChange(seats.filter(s => !outIds.has(s._id)));
      toast({ title: `${outOfBounds.length} seat(s) removed (outside new boundary)` });
    }

    onSectionsChange(sections.map(s => s.id === updated.id ? updated : s));
    setEditingSection(updated);
  };

  // ── Wall element CRUD ──
  const handleAddWallElement = (type: RoomElement['type']) => {
    let pos = { x: 0, y: 0 };
    if (type === 'door') pos = { x: roomWidth / 2 - 20, y: roomHeight - 4 };
    else if (type === 'window') pos = { x: 4, y: roomHeight / 2 - 15 };
    else if (type === 'screen') pos = { x: roomWidth / 2 - 20, y: 4 };
    else if (type === 'AC') pos = { x: roomWidth - 44, y: 4 };
    else if (type === 'bath') pos = { x: 4, y: 4 };

    const newEl: RoomElement = { id: `elem-${Date.now()}`, type, position: pos };
    onRoomElementsChange([...roomElements, newEl]);
  };

  const handleDeleteElement = (id: string) => {
    onRoomElementsChange(roomElements.filter(e => e.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const constrainToWall = (pos: { x: number; y: number }, elW: number, elH: number) => {
    const margin = 4;
    const distTop = pos.y;
    const distBottom = roomHeight - pos.y - elH;
    const distLeft = pos.x;
    const distRight = roomWidth - pos.x - elW;
    const minDist = Math.min(distTop, distBottom, distLeft, distRight);

    if (minDist === distTop) return { x: Math.max(margin, Math.min(pos.x, roomWidth - elW - margin)), y: margin };
    if (minDist === distBottom) return { x: Math.max(margin, Math.min(pos.x, roomWidth - elW - margin)), y: roomHeight - elH - margin };
    if (minDist === distLeft) return { x: margin, y: Math.max(margin, Math.min(pos.y, roomHeight - elH - margin)) };
    return { x: roomWidth - elW - margin, y: Math.max(margin, Math.min(pos.y, roomHeight - elH - margin)) };
  };

  // ── Resize handles ──
  const handleResizeMouseDown = (e: React.MouseEvent, sectionId: string, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    const canvasPos = getCanvasPos(e);
    setResizing({
      id: sectionId,
      handle,
      startMouseX: canvasPos.x,
      startMouseY: canvasPos.y,
      startX: section.position.x,
      startY: section.position.y,
      startW: section.width,
      startH: section.height,
    });
  };

  const processResize = useCallback((canvasPos: { x: number; y: number }) => {
    if (!resizing) return;
    const dx = canvasPos.x - resizing.startMouseX;
    const dy = canvasPos.y - resizing.startMouseY;
    const h = resizing.handle;

    let newX = resizing.startX;
    let newY = resizing.startY;
    let newW = resizing.startW;
    let newH = resizing.startH;

    if (h.includes('e')) newW = snap(Math.max(100, resizing.startW + dx));
    if (h.includes('w')) { const dw = snap(dx); newX = resizing.startX + dw; newW = Math.max(100, resizing.startW - dw); }
    if (h.includes('s')) newH = snap(Math.max(80, resizing.startH + dy));
    if (h.includes('n')) { const dh = snap(dy); newY = resizing.startY + dh; newH = Math.max(80, resizing.startH - dh); }

    // Clamp within room
    newX = Math.max(gridSize, newX);
    newY = Math.max(gridSize, newY);
    if (newX + newW > roomWidth - gridSize) newW = roomWidth - gridSize - newX;
    if (newY + newH > roomHeight - gridSize) newH = roomHeight - gridSize - newY;

    onSectionsChange(sections.map(s =>
      s.id === resizing.id ? { ...s, position: { x: newX, y: newY }, width: newW, height: newH } : s
    ));
  }, [resizing, sections, onSectionsChange, snap, gridSize, roomWidth, roomHeight]);

  const finalizeResize = useCallback(() => {
    if (!resizing) return;
    const section = sections.find(s => s.id === resizing.id);
    if (section) {
      // Remove out-of-bounds seats
      const sectionSeats = seats.filter(s => s.sectionId === section.id);
      const outOfBounds = sectionSeats.filter(seat => {
        const relX = seat.position.x - section.position.x;
        const relY = seat.position.y - section.position.y;
        return relX + 36 > section.width - 5 || relY + 26 > section.height - 5 || relX < 0 || relY < 28;
      });
      if (outOfBounds.length > 0) {
        outOfBounds.forEach(seat => { if (onDeleteSeat) onDeleteSeat(seat._id); });
        const outIds = new Set(outOfBounds.map(s => s._id));
        onSeatsChange(seats.filter(s => !outIds.has(s._id)));
        toast({ title: `${outOfBounds.length} seat(s) removed after resize` });
      }
    }
    setResizing(null);
  }, [resizing, sections, seats, onDeleteSeat, onSeatsChange]);

  // ── Section dragging ──
  const handleSectionMouseDown = (e: React.MouseEvent, sectionId: string, pos: { x: number; y: number }) => {
    e.preventDefault();
    e.stopPropagation();
    const canvasPos = getCanvasPos(e);
    setDraggingSection(sectionId);
    setDragOffset({ x: canvasPos.x - pos.x, y: canvasPos.y - pos.y });
  };

  // ── Element dragging ──
  const handleElementMouseDown = (e: React.MouseEvent, elemId: string, pos: { x: number; y: number }) => {
    e.preventDefault();
    e.stopPropagation();
    const canvasPos = getCanvasPos(e);
    setDraggingElement(elemId);
    setElementDragOffset({ x: canvasPos.x - pos.x, y: canvasPos.y - pos.y });
    setSelectedElement(elemId);
  };

  // ── Canvas mouse handlers ──
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (draggingSection || draggingElement || resizing) return;
    setSelectedElement(null);

    // Placement mode: place a seat on click
    if (placementMode && onPlaceSeat) {
      const pos = getCanvasPos(e);
      // Only place if within room bounds
      if (pos.x >= 0 && pos.y >= 0 && pos.x <= roomWidth && pos.y <= roomHeight) {
        onPlaceSeat({ x: Math.round(pos.x), y: Math.round(pos.y) }, nextSeatNumber, placementPrice);
        setNextSeatNumber(prev => prev + 1);
      }
      return;
    }

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (resizing) {
      const pos = getCanvasPos(e);
      processResize(pos);
      return;
    }

    if (isPanning && !draggingSection && !draggingElement) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    if (draggingSection) {
      const pos = getCanvasPos(e);
      const newX = snap(pos.x - dragOffset.x);
      const newY = snap(pos.y - dragOffset.y);
      const section = sections.find(s => s.id === draggingSection);
      if (section) {
        const clampedX = Math.max(gridSize, Math.min(newX, roomWidth - section.width - gridSize));
        const clampedY = Math.max(gridSize, Math.min(newY, roomHeight - section.height - gridSize));
        const dx = clampedX - section.position.x;
        const dy = clampedY - section.position.y;
        if (dx !== 0 || dy !== 0) {
          onSeatsChange(seats.map(s =>
            s.sectionId === draggingSection
              ? { ...s, position: { x: s.position.x + dx, y: s.position.y + dy } }
              : s
          ));
          onSectionsChange(sections.map(s =>
            s.id === draggingSection ? { ...s, position: { x: clampedX, y: clampedY } } : s
          ));
        }
      }
      return;
    }

    if (draggingElement) {
      const pos = getCanvasPos(e);
      const newX = pos.x - elementDragOffset.x;
      const newY = pos.y - elementDragOffset.y;
      const constrained = constrainToWall({ x: newX, y: newY }, 40, 30);
      onRoomElementsChange(roomElements.map(el =>
        el.id === draggingElement ? { ...el, position: constrained } : el
      ));
    }
  };

  const handleCanvasMouseUp = () => {
    if (resizing) { finalizeResize(); return; }
    setDraggingSection(null);
    setDraggingElement(null);
    setIsPanning(false);
  };

  useEffect(() => {
    const handler = () => {
      if (resizing) finalizeResize();
      setDraggingSection(null);
      setDraggingElement(null);
      setIsPanning(false);
    };
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, [resizing, finalizeResize]);

  // ── Layout image upload ──
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLayoutImageChange) return;
    const reader = new FileReader();
    reader.onload = () => {
      onLayoutImageChange(reader.result as string);
    };
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

  // ── Get section color theme ──
  const getSectionTheme = (section: Section) => {
    const color = section.color || 'blue';
    return SECTION_COLORS[color] || SECTION_COLORS.blue;
  };

  // ── Render seats within a section ──
  const renderSectionSeats = (section: Section) => {
    if (section.type !== 'seats') return null;
    const sectionSeats = seats.filter(s => s.sectionId === section.id);
    const theme = getSectionTheme(section);

    return sectionSeats.map(seat => {
      const isSelected = selectedSeat?._id === seat._id;
      const isBooked = !seat.isAvailable;

      let seatClass = theme.seat;
      if (isSelected) seatClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/50';
      else if (isBooked) seatClass = 'bg-muted border-muted-foreground/30 text-muted-foreground';

      return (
        <div key={seat._id} className="group absolute" style={{
          left: seat.position.x - section.position.x,
          top: seat.position.y - section.position.y,
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
    });
  };

  // ── Render resize handles for a section ──
  const renderResizeHandles = (section: Section) => {
    const handles: { handle: ResizeHandle; style: React.CSSProperties }[] = [
      { handle: 'nw', style: { left: -4, top: -4 } },
      { handle: 'n', style: { left: '50%', top: -4, transform: 'translateX(-50%)' } },
      { handle: 'ne', style: { right: -4, top: -4 } },
      { handle: 'w', style: { left: -4, top: '50%', transform: 'translateY(-50%)' } },
      { handle: 'e', style: { right: -4, top: '50%', transform: 'translateY(-50%)' } },
      { handle: 'sw', style: { left: -4, bottom: -4 } },
      { handle: 's', style: { left: '50%', bottom: -4, transform: 'translateX(-50%)' } },
      { handle: 'se', style: { right: -4, bottom: -4 } },
    ];

    return handles.map(({ handle, style }) => (
      <div
        key={handle}
        className="absolute w-2 h-2 bg-primary border border-primary-foreground rounded-sm z-30"
        style={{ ...style, cursor: HANDLE_CURSORS[handle] }}
        onMouseDown={e => handleResizeMouseDown(e, section.id, handle)}
      />
    ));
  };

  // ── Get wall element icon ──
  const getElementIcon = (type: RoomElement['type']) => {
    switch (type) {
      case 'door': return <DoorOpen className="h-3.5 w-3.5" />;
      case 'window': return <Wind className="h-3.5 w-3.5" />;
      case 'screen': return <Monitor className="h-3.5 w-3.5" />;
      case 'AC': return <Snowflake className="h-3.5 w-3.5" />;
      case 'bath': return <Bath className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/50 rounded-lg border">
        {/* Room dimensions */}
        <div className="flex items-center gap-1.5">
          <Label className="text-xs whitespace-nowrap">W:</Label>
          <Input type="number" className="w-20 h-8 text-xs" value={roomWidth} min={400} max={2000} step={20}
            onChange={e => onRoomDimensionsChange(+e.target.value || 800, roomHeight, gridSize)} />
          <Label className="text-xs whitespace-nowrap">H:</Label>
          <Input type="number" className="w-20 h-8 text-xs" value={roomHeight} min={300} max={1600} step={20}
            onChange={e => onRoomDimensionsChange(roomWidth, +e.target.value || 600, gridSize)} />
        </div>

        <div className="h-6 w-px bg-border" />

        <Button variant={showGrid ? 'default' : 'outline'} size="sm" className="h-8" onClick={() => setShowGrid(!showGrid)}>
          <Grid3X3 className="h-3.5 w-3.5 mr-1" /> Grid
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Add section buttons */}
        <Button variant="outline" size="sm" className="h-8" onClick={handleAddSeatSection}>
          <LayoutGrid className="h-3.5 w-3.5 mr-1" /> Add Seat Section
        </Button>

        {/* Wall elements dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <DoorOpen className="h-3.5 w-3.5 mr-1" /> Wall Element <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {WALL_ELEMENT_TYPES.map(item => (
              <DropdownMenuItem key={item.type} onClick={() => handleAddWallElement(item.type)}>
                {item.icon}
                <span className="ml-2">{item.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
          <div className="flex items-center gap-1.5">
            <Label className="text-xs whitespace-nowrap">Price:</Label>
            <Input
              type="number"
              className="w-20 h-8 text-xs"
              value={placementPrice}
              min={0}
              onChange={e => setPlacementPrice(+e.target.value || 0)}
            />
            <span className="text-xs text-muted-foreground">Next: #{nextSeatNumber}</span>
          </div>
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
        style={{ height: '600px', cursor: placementMode ? 'crosshair' : (resizing ? HANDLE_CURSORS[resizing.handle] : (isPanning ? 'grabbing' : 'grab')) }}
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

          <RoomWalls width={roomWidth} height={roomHeight} />
          <GridOverlay width={roomWidth} height={roomHeight} gridSize={gridSize} visible={showGrid} />

          {/* Render wall elements */}
          {roomElements.map(elem => {
            const styleClass = WALL_ELEMENT_STYLES[elem.type] || 'bg-muted border-border text-muted-foreground';
            const isSelected = selectedElement === elem.id;
            return (
              <div
                key={elem.id}
                className={`absolute flex flex-col items-center justify-center rounded border-2 select-none text-[9px] font-semibold ${styleClass} ${isSelected ? 'ring-2 ring-primary' : ''}`}
                style={{
                  left: elem.position.x,
                  top: elem.position.y,
                  width: 40,
                  height: 30,
                  cursor: draggingElement === elem.id ? 'grabbing' : 'grab',
                  zIndex: draggingElement === elem.id ? 60 : 10,
                }}
                onMouseDown={e => handleElementMouseDown(e, elem.id, elem.position)}
                onClick={e => { e.stopPropagation(); setSelectedElement(elem.id); }}
              >
                {getElementIcon(elem.type)}
                <span className="leading-none mt-0.5">{elem.type}</span>
                {isSelected && (
                  <button
                    className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[8px]"
                    onClick={e => { e.stopPropagation(); handleDeleteElement(elem.id); }}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {/* Render sections */}
          {sections.map(section => {
            const isStructural = section.type === 'structural';
            const theme = getSectionTheme(section);
            const colorClass = isStructural
              ? (STRUCTURAL_COLORS[section.structuralLabel || 'Custom'] || STRUCTURAL_COLORS.Custom)
              : `${theme.border}`;

            return (
              <div
                key={section.id}
                className={`absolute rounded-lg border-2 select-none overflow-visible ${colorClass}`}
                style={{
                  left: section.position.x,
                  top: section.position.y,
                  width: section.width,
                  height: section.height,
                  cursor: draggingSection === section.id ? 'grabbing' : 'grab',
                  zIndex: draggingSection === section.id ? 50 : 3,
                  backgroundColor: layoutImage ? 'rgba(255,255,255,0.35)' : 'hsl(var(--background))',
                }}
                onMouseDown={e => handleSectionMouseDown(e, section.id, section.position)}
              >
                {/* Resize handles */}
                {renderResizeHandles(section)}

                {/* Section header */}
                <div className={`flex items-center justify-between px-2 py-1 border-b border-inherit ${isStructural ? 'bg-inherit' : theme.header}`}>
                  <div className="flex items-center gap-1">
                    <GripHorizontal className="h-3 w-3 opacity-50" />
                    <span className="text-xs font-semibold truncate">{section.name}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {!isStructural && onAddSeatToSection && (
                      <button
                        className="p-0.5 hover:bg-primary/10 rounded text-primary"
                        onClick={e => { e.stopPropagation(); onAddSeatToSection(section); }}
                        title="Add seat"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      className="p-0.5 hover:bg-muted rounded"
                      onClick={e => { e.stopPropagation(); setEditingSection(section); setShowSectionEditor(true); }}
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      className="p-0.5 hover:bg-destructive/10 rounded text-destructive"
                      onClick={e => { e.stopPropagation(); handleDeleteSection(section.id); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Section body */}
                <div className="relative w-full overflow-hidden" style={{ height: section.height - 28 }}>
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
          {/* Render free-placed seats (no sectionId) */}
          {seats.filter(s => !s.sectionId).map(seat => {
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

      {/* Legend with color-coded sections */}
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
        {sections.filter(s => s.type === 'seats').map(section => {
          const theme = getSectionTheme(section);
          return (
            <div key={section.id} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${theme.dot}`} />
              <span>{section.name}</span>
            </div>
          );
        })}
      </div>

      {/* Section editor dialog */}
      {editingSection && (
        <SectionEditorDialog
          section={editingSection}
          open={showSectionEditor}
          onOpenChange={setShowSectionEditor}
          onUpdate={handleUpdateSection}
          onGenerateSeats={onGenerateSeatsForSection}
          onDelete={handleDeleteSection}
        />
      )}
    </div>
  );
};

// ── Section Editor Dialog ──────────────────────────────────────────
interface SectionEditorDialogProps {
  section: Section;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (section: Section) => void;
  onGenerateSeats: (section: Section) => void;
  onDelete: (id: string) => void;
}

const COLOR_OPTIONS = Object.keys(SECTION_COLORS);

const SectionEditorDialog: React.FC<SectionEditorDialogProps> = ({
  section,
  open,
  onOpenChange,
  onUpdate,
  onGenerateSeats,
  onDelete,
}) => {
  const [local, setLocal] = useState<Section>(section);

  useEffect(() => { setLocal(section); }, [section]);

  const update = (partial: Partial<Section>) => setLocal(prev => ({ ...prev, ...partial }));

  const handleSave = () => {
    onUpdate(local);
    onOpenChange(false);
  };

  const handleGenerateSeats = () => {
    onUpdate(local);
    onGenerateSeats(local);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Edit Section
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div>
            <Label>Section Name</Label>
            <Input value={local.name} onChange={e => update({ name: e.target.value })} />
          </div>

          {/* Color theme picker */}
          {local.type === 'seats' && (
            <div>
              <Label>Color Theme</Label>
              <div className="flex gap-2 mt-1.5">
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${SECTION_COLORS[color].dot} ${
                      (local.color || 'blue') === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => update({ color })}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Width (px)</Label>
              <Input type="number" min={100} max={1200} value={local.width}
                onChange={e => update({ width: +e.target.value || 200 })} />
            </div>
            <div>
              <Label>Height (px)</Label>
              <Input type="number" min={80} max={800} value={local.height}
                onChange={e => update({ height: +e.target.value || 150 })} />
            </div>
          </div>

          {local.type === 'seats' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rows</Label>
                  <Input type="number" min={1} max={20} value={local.rows || 5}
                    onChange={e => update({ rows: +e.target.value || 1 })} />
                </div>
                <div>
                  <Label>Columns</Label>
                  <Input type="number" min={1} max={30} value={local.cols || 6}
                    onChange={e => update({ cols: +e.target.value || 1 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aisle After Col</Label>
                  <Input type="number" min={0} max={local.cols || 30} value={local.aisleAfterCol || 0}
                    onChange={e => update({ aisleAfterCol: +e.target.value || 0 })} />
                </div>
                <div>
                  <Label>Spacing (px)</Label>
                  <Input type="number" min={30} max={100} value={local.seatSpacing || 50}
                    onChange={e => update({ seatSpacing: +e.target.value || 50 })} />
                </div>
              </div>
              <div>
                <Label>Price per Seat (₹/month)</Label>
                <Input type="number" min={0} value={local.price || 0}
                  onChange={e => update({ price: +e.target.value || 0 })} />
              </div>

              <div className="bg-muted rounded-lg p-3 text-sm">
                <p><strong>Preview:</strong> {(local.rows || 0) * (local.cols || 0)} seats in {local.rows} rows × {local.cols} columns</p>
                {(local.aisleAfterCol || 0) > 0 && (
                  <p className="text-muted-foreground">Aisle gap after every {local.aisleAfterCol} seats</p>
                )}
              </div>
            </>
          )}

          {local.type === 'structural' && (
            <div>
              <Label>Label</Label>
              <Input value={local.structuralLabel || local.name} onChange={e => update({ structuralLabel: e.target.value, name: e.target.value })} />
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={() => { onDelete(local.id); onOpenChange(false); }}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
          <div className="flex-1" />
          {local.type === 'seats' && (
            <Button variant="outline" onClick={handleGenerateSeats}>
              <Grid3X3 className="h-3.5 w-3.5 mr-1" /> Generate Seats
            </Button>
          )}
          <Button onClick={handleSave}>Save Section</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
