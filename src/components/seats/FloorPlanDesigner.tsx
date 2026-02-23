import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Save, Grid3X3, ZoomIn, ZoomOut, Maximize, Plus, LayoutGrid,
  Trash2, GripHorizontal, Building2, Edit,
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
  structuralLabel?: string; // e.g. "Washroom", "Office"
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
  isSaving?: boolean;
}

const STRUCTURAL_TYPES = ['Washroom', 'Office', 'Lockers', 'Storage', 'Custom'];

const STRUCTURAL_COLORS: Record<string, string> = {
  Washroom: 'bg-blue-100 border-blue-300 text-blue-700',
  Office: 'bg-amber-100 border-amber-300 text-amber-700',
  Lockers: 'bg-violet-100 border-violet-300 text-violet-700',
  Storage: 'bg-stone-100 border-stone-300 text-stone-700',
  Custom: 'bg-muted border-border text-muted-foreground',
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
  isSaving,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Section dragging
  const [draggingSection, setDraggingSection] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Section editor
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [showAddStructural, setShowAddStructural] = useState(false);

  const snap = useCallback((val: number) => Math.round(val / gridSize) * gridSize, [gridSize]);

  // ── Canvas coordinate helpers ──
  const getCanvasPos = useCallback((e: React.MouseEvent) => {
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
    };
    onSectionsChange([...sections, newSection]);
    setEditingSection(newSection);
    setShowSectionEditor(true);
  };

  const handleAddStructural = (label: string) => {
    const newSection: Section = {
      id: `struct-${Date.now()}`,
      name: label,
      type: 'structural',
      position: { x: snap(40), y: snap(roomHeight - 160) },
      width: 150,
      height: 100,
      structuralLabel: label,
    };
    onSectionsChange([...sections, newSection]);
    setShowAddStructural(false);
  };

  const handleDeleteSection = (id: string) => {
    onSectionsChange(sections.filter(s => s.id !== id));
    // Remove seats belonging to this section
    onSeatsChange(seats.filter(s => s.sectionId !== id));
    if (editingSection?.id === id) {
      setEditingSection(null);
      setShowSectionEditor(false);
    }
  };

  const handleUpdateSection = (updated: Section) => {
    onSectionsChange(sections.map(s => s.id === updated.id ? updated : s));
    setEditingSection(updated);
  };

  // ── Section dragging ──
  const handleSectionMouseDown = (e: React.MouseEvent, sectionId: string, pos: { x: number; y: number }) => {
    e.preventDefault();
    e.stopPropagation();
    const canvasPos = getCanvasPos(e);
    setDraggingSection(sectionId);
    setDragOffset({ x: canvasPos.x - pos.x, y: canvasPos.y - pos.y });
  };

  // ── Canvas mouse handlers ──
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (draggingSection) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning && !draggingSection) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }
    if (!draggingSection) return;

    const pos = getCanvasPos(e);
    const newX = snap(pos.x - dragOffset.x);
    const newY = snap(pos.y - dragOffset.y);

    const section = sections.find(s => s.id === draggingSection);
    if (section) {
      const clampedX = Math.max(gridSize, Math.min(newX, roomWidth - section.width - gridSize));
      const clampedY = Math.max(gridSize, Math.min(newY, roomHeight - section.height - gridSize));
      handleUpdateSection({ ...section, position: { x: clampedX, y: clampedY } });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingSection(null);
    setIsPanning(false);
  };

  useEffect(() => {
    const handler = () => { setDraggingSection(null); setIsPanning(false); };
    window.addEventListener('mouseup', handler);
    return () => window.removeEventListener('mouseup', handler);
  }, []);

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

  // ── Render seats within a section ──
  const renderSectionSeats = (section: Section) => {
    if (section.type !== 'seats') return null;
    const sectionSeats = seats.filter(s => s.sectionId === section.id);
    return sectionSeats.map(seat => {
      const isSelected = selectedSeat?._id === seat._id;
      const isBooked = !seat.isAvailable;

      let seatClass = 'bg-emerald-50 border-emerald-400 text-emerald-800';
      if (isSelected) seatClass = 'bg-primary border-primary text-primary-foreground ring-2 ring-primary/50';
      else if (isBooked) seatClass = 'bg-muted border-muted-foreground/30 text-muted-foreground';

      return (
        <button
          key={seat._id}
          className={`absolute flex items-center justify-center rounded border text-[10px] font-bold select-none transition-all ${seatClass}`}
          style={{
            left: seat.position.x - section.position.x,
            top: seat.position.y - section.position.y,
            width: 36,
            height: 26,
            zIndex: isSelected ? 20 : 5,
          }}
          onClick={e => {
            e.stopPropagation();
            onSeatSelect(isSelected ? null : seat);
          }}
        >
          {seat.number}
        </button>
      );
    });
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
        <Button variant="outline" size="sm" className="h-8" onClick={() => setShowAddStructural(true)}>
          <Building2 className="h-3.5 w-3.5 mr-1" /> Add Structure
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

        <Button size="sm" className="h-8" onClick={onSave} disabled={isSaving}>
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
          <RoomWalls width={roomWidth} height={roomHeight} />
          <GridOverlay width={roomWidth} height={roomHeight} gridSize={gridSize} visible={showGrid} />

          {/* Render sections */}
          {sections.map(section => {
            const isStructural = section.type === 'structural';
            const colorClass = isStructural
              ? (STRUCTURAL_COLORS[section.structuralLabel || 'Custom'] || STRUCTURAL_COLORS.Custom)
              : 'bg-background border-primary/40';

            return (
              <div
                key={section.id}
                className={`absolute rounded-lg border-2 select-none overflow-hidden ${colorClass}`}
                style={{
                  left: section.position.x,
                  top: section.position.y,
                  width: section.width,
                  height: section.height,
                  cursor: draggingSection === section.id ? 'grabbing' : 'grab',
                  zIndex: draggingSection === section.id ? 50 : 3,
                }}
                onMouseDown={e => handleSectionMouseDown(e, section.id, section.position)}
              >
                {/* Section header */}
                <div className="flex items-center justify-between px-2 py-1 bg-inherit border-b border-inherit">
                  <div className="flex items-center gap-1">
                    <GripHorizontal className="h-3 w-3 opacity-50" />
                    <span className="text-xs font-semibold truncate">{section.name}</span>
                  </div>
                  <div className="flex gap-0.5">
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
          <span>Booked/Blocked</span>
        </div>
      </div>

      {/* Add structural dialog */}
      <Dialog open={showAddStructural} onOpenChange={setShowAddStructural}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Structure</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {STRUCTURAL_TYPES.map(label => (
              <Button key={label} variant="outline" className="h-16 flex-col gap-1" onClick={() => handleAddStructural(label)}>
                <Building2 className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

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
              <Select value={local.structuralLabel || 'Custom'} onValueChange={v => update({ structuralLabel: v, name: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STRUCTURAL_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
