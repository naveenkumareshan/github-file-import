import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { adminCabinsService } from "@/api/adminCabinsService";
import { adminSeatsService, SeatData } from "@/api/adminSeatsService";
import { ArrowLeft, Building, Plus, Trash2 } from "lucide-react";
import { FloorPlanDesigner, FloorPlanSeat, RoomElement, Section } from "@/components/seats/FloorPlanDesigner";

const SeatManagement = () => {
  const { cabinId } = useParams<{ cabinId: string }>();
  const navigate = useNavigate();

  const [cabin, setCabin] = useState<any>(null);
  const [seats, setSeats] = useState<FloorPlanSeat[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<FloorPlanSeat | null>(null);
  const [loading, setLoading] = useState(true);
  const [roomElements, setRoomElements] = useState<RoomElement[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const [layoutImageOpacity, setLayoutImageOpacity] = useState(30);

  // Room dimensions
  const [roomWidth, setRoomWidth] = useState(800);
  const [roomHeight, setRoomHeight] = useState(600);
  const [gridSize, setGridSize] = useState(20);

  // Floors
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [floorNumber, setFloorNumber] = useState("");
  const [editingFloorId, setEditingFloorId] = useState<number | null>(null);
  const [showAddFloorForm, setShowAddFloorForm] = useState(false);

  // Seat details
  const [price, setPrice] = useState(0);

  // Use ref for sections to avoid stale closure in fetchSeats
  const sectionsRef = useRef<Section[]>([]);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  useEffect(() => {
    if (cabinId) fetchCabinData(cabinId);
  }, [cabinId]);

  useEffect(() => {
    if (cabinId && selectedFloor) fetchSeats(cabinId, selectedFloor);
  }, [selectedFloor]);

  const fetchCabinData = async (id: string) => {
    try {
      setLoading(true);
      const res = await adminCabinsService.getCabinById(id);
      if (res.success) {
        const d = res.data;
        setCabin(d);
        setFloors(Array.isArray(d.floors) ? d.floors : []);
        setRoomWidth(d.room_width || 800);
        setRoomHeight(d.room_height || 600);
        setGridSize(d.grid_size || 20);
        setRoomElements(Array.isArray(d.room_elements) && d.room_elements.length > 0 ? d.room_elements : []);
        const loadedSections = Array.isArray(d.sections) ? d.sections : [];
        setSections(loadedSections);
        sectionsRef.current = loadedSections;
        setLayoutImage(d.layout_image || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const assignSectionIds = (seatList: FloorPlanSeat[], sectionList: Section[]): FloorPlanSeat[] => {
    return seatList.map(seat => {
      const matchingSection = sectionList.find(s =>
        s.type === 'seats' &&
        seat.position.x >= s.position.x &&
        seat.position.x < s.position.x + s.width &&
        seat.position.y >= s.position.y &&
        seat.position.y < s.position.y + s.height
      );
      return { ...seat, sectionId: matchingSection?.id };
    });
  };

  const fetchSeats = async (id: string, floor: number) => {
    try {
      setLoading(true);
      const res = await adminSeatsService.getSeatsByCabin(id, floor.toString());
      if (res.success) setSeats(assignSectionIds(res.data, sectionsRef.current));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!cabinId) return;
    setIsSaving(true);
    try {
      await adminCabinsService.updateCabinLayout(cabinId, roomElements, roomWidth, roomHeight, gridSize, sections, layoutImage);

      const seatsToUpdate = seats.map(s => ({
        _id: s._id,
        position: s.position,
      }));
      await adminSeatsService.updateSeatPositions(seatsToUpdate);

      toast({ title: "Layout saved successfully" });
    } catch (e) {
      toast({ title: "Error saving layout", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSeatsForSection = async (section: Section) => {
    if (!cabinId || section.type !== 'seats') return;
    try {
      // Remove existing seats for this section from DB
      const existingSeats = seats.filter(s => s.sectionId === section.id);
      for (const s of existingSeats) {
        await adminSeatsService.deleteSeat(s._id);
      }

      // Generate new seats
      const rows = section.rows || 5;
      const cols = section.cols || 6;
      const spacing = section.seatSpacing || 50;
      const aisleAfter = section.aisleAfterCol || 0;
      const seatPrice = section.price || 2000;

      const otherSeats = seats.filter(s => s.sectionId !== section.id);
      let seatNumber = otherSeats.length > 0
        ? Math.max(...otherSeats.map(s => s.number)) + 1
        : 1;

      const startX = section.position.x + 10;
      const startY = section.position.y + 34;

      const newSeats: SeatData[] = [];
      for (let r = 0; r < rows; r++) {
        let colOffset = 0;
        for (let c = 0; c < cols; c++) {
          if (aisleAfter > 0 && c > 0 && c % aisleAfter === 0) {
            colOffset += spacing * 0.6;
          }

          const x = Math.round(startX + c * spacing + colOffset);
          const y = Math.round(startY + r * (spacing * 0.6));

          if (x + 36 > section.position.x + section.width - 5) continue;
          if (y + 26 > section.position.y + section.height - 5) continue;

          newSeats.push({
            number: seatNumber++,
            floor: selectedFloor,
            cabinId,
            price: seatPrice,
            position: { x, y },
            isAvailable: true,
            isHotSelling: false,
            sectionId: section.id,
            rowIndex: r,
            colIndex: c,
          });
        }
      }

      const res = await adminSeatsService.bulkCreateSeats(newSeats);
      if (res.success) {
        await fetchSeats(cabinId, selectedFloor);
        toast({ title: `${newSeats.length} seats generated for "${section.name}"` });
      }
    } catch (e) {
      toast({ title: "Error generating seats", variant: "destructive" });
    }
  };

  // ── Individual seat delete (DB + local) ──
  const handleDeleteSeat = async (seatId: string) => {
    try {
      await adminSeatsService.deleteSeat(seatId);
      setSeats(prev => prev.filter(s => s._id !== seatId));
      if (selectedSeat?._id === seatId) setSelectedSeat(null);
      toast({ title: "Seat deleted" });
    } catch (e) {
      toast({ title: "Error deleting seat", variant: "destructive" });
    }
  };

  // ── Add single seat to section ──
  const handleAddSeatToSection = async (section: Section) => {
    if (!cabinId) return;
    try {
      const sectionSeats = seats.filter(s => s.sectionId === section.id);
      const maxNumber = seats.length > 0 ? Math.max(...seats.map(s => s.number)) : 0;
      const spacing = section.seatSpacing || 50;

      // Find next available grid position
      const startX = section.position.x + 10;
      const startY = section.position.y + 34;
      const cols = section.cols || 6;
      const aisleAfter = section.aisleAfterCol || 0;

      let placed = false;
      let x = 0, y = 0, rowIdx = 0, colIdx = 0;

      for (let r = 0; r < 50 && !placed; r++) {
        let colOffset = 0;
        for (let c = 0; c < cols && !placed; c++) {
          if (aisleAfter > 0 && c > 0 && c % aisleAfter === 0) {
            colOffset += spacing * 0.6;
          }
          x = Math.round(startX + c * spacing + colOffset);
          y = Math.round(startY + r * (spacing * 0.6));

          if (x + 36 > section.position.x + section.width - 5) continue;
          if (y + 26 > section.position.y + section.height - 5) continue;

          // Check if position is already occupied
          const occupied = sectionSeats.some(s =>
            Math.abs(s.position.x - x) < 20 && Math.abs(s.position.y - y) < 15
          );
          if (!occupied) {
            placed = true;
            rowIdx = r;
            colIdx = c;
          }
        }
      }

      if (!placed) {
        toast({ title: "No space available in section", variant: "destructive" });
        return;
      }

      const seatData: SeatData = {
        number: maxNumber + 1,
        floor: selectedFloor,
        cabinId,
        price: section.price || 2000,
        position: { x, y },
        isAvailable: true,
        isHotSelling: false,
        sectionId: section.id,
        rowIndex: rowIdx,
        colIndex: colIdx,
      };

      const res = await adminSeatsService.createSeat(seatData);
      if (res.success && res.data) {
        setSeats(prev => [...prev, { ...res.data, sectionId: section.id }]);
        toast({ title: `Seat #${seatData.number} added` });
      }
    } catch (e) {
      toast({ title: "Error adding seat", variant: "destructive" });
    }
  };

  // ── Delete section with all its seats from DB ──
  const handleDeleteSectionWithSeats = async (sectionId: string) => {
    try {
      const sectionSeats = seats.filter(s => s.sectionId === sectionId);
      // Delete all seats from DB
      for (const s of sectionSeats) {
        await adminSeatsService.deleteSeat(s._id);
      }
      // Remove from local state
      setSections(prev => prev.filter(s => s.id !== sectionId));
      setSeats(prev => prev.filter(s => s.sectionId !== sectionId));
      toast({ title: "Section and its seats deleted" });
    } catch (e) {
      toast({ title: "Error deleting section", variant: "destructive" });
    }
  };

  // ── Click-to-place seat handler ──
  const handlePlaceSeat = async (position: { x: number; y: number }, number: number, price: number) => {
    if (!cabinId) return;
    try {
      const seatData: SeatData = {
        number,
        floor: selectedFloor,
        cabinId,
        price,
        position,
        isAvailable: true,
        isHotSelling: false,
      };
      const res = await adminSeatsService.createSeat(seatData);
      if (res.success && res.data) {
        setSeats(prev => [...prev, res.data]);
        toast({ title: `Seat #${number} placed` });
      }
    } catch (e) {
      toast({ title: "Error placing seat", variant: "destructive" });
    }
  };

  const handleToggleSeatAvailability = async () => {
    if (!selectedSeat) return;
    try {
      const res = await adminSeatsService.updateSeat(selectedSeat._id, {
        isAvailable: !selectedSeat.isAvailable,
      });
      if (res.success) {
        setSeats(seats.map(s => s._id === selectedSeat._id ? { ...s, isAvailable: !s.isAvailable } : s));
        setSelectedSeat({ ...selectedSeat, isAvailable: !selectedSeat.isAvailable });
        toast({ title: `Seat ${selectedSeat.number} updated` });
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handlePriceUpdate = async () => {
    if (!selectedSeat) return;
    try {
      const res = await adminSeatsService.updateSeat(selectedSeat._id, { price });
      if (res.success) {
        setSeats(seats.map(s => s._id === selectedSeat._id ? { ...s, price } : s));
        setSelectedSeat({ ...selectedSeat, price });
        toast({ title: `Price updated for seat ${selectedSeat.number}` });
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const toggleCabinStatus = async () => {
    if (!cabin) return;
    try {
      const res = await adminCabinsService.updateCabin(cabin.id, { is_active: !cabin.is_active });
      if (res.success) {
        setCabin(res.data);
        toast({ title: `Room ${res.data.is_active ? "activated" : "deactivated"}` });
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleAddOrUpdateFloor = async () => {
    if (!floorNumber || !cabin) return;
    try {
      const res = await adminCabinsService.addUpdateCabinFloor(cabin.id, {
        floorId: editingFloorId,
        number: floorNumber,
      });
      if (res.success) {
        setFloors(res.data.floors);
        toast({ title: editingFloorId ? "Floor updated" : "Floor added" });
        setFloorNumber("");
        setEditingFloorId(null);
        setShowAddFloorForm(false);
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  if (loading && !cabin) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Rooms
      </Button>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">{cabin?.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {cabin?.category} • {cabin?.capacity} capacity • ₹{cabin?.price}/month
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Label className={cabin?.is_active ? "text-emerald-600" : "text-destructive"}>
              {cabin?.is_active ? "Active" : "Inactive"}
            </Label>
            <Switch checked={cabin?.is_active || false} onCheckedChange={toggleCabinStatus} />
          </div>
        </CardHeader>
      </Card>

      {/* Floor selector */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Floors</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-4">
            {floors.map((floor: any) => (
              <div key={floor.id}
                className={`border rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  selectedFloor === floor.id ? "bg-primary/10 border-primary shadow-sm" : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedFloor(floor.id)}
              >
                <Building className="h-5 w-5" />
                <span className="text-sm font-medium">Floor {floor.number}</span>
                <Button size="sm" variant="ghost" className="text-xs h-6 px-2"
                  onClick={e => { e.stopPropagation(); setFloorNumber(floor.number.toString()); setEditingFloorId(floor.id); setShowAddFloorForm(true); }}
                >Edit</Button>
              </div>
            ))}
            <div className="border border-dashed rounded-lg p-3 flex flex-col items-center gap-1 cursor-pointer text-muted-foreground hover:border-primary/50"
              onClick={() => { setFloorNumber(""); setEditingFloorId(null); setShowAddFloorForm(true); }}
            >
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Add Floor</span>
            </div>
          </div>

          {showAddFloorForm && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">{editingFloorId ? "Update Floor" : "Add Floor"}</h3>
              <div className="flex items-end gap-3">
                <div>
                  <Label>Floor Number</Label>
                  <Input type="number" min={1} value={floorNumber} onChange={e => setFloorNumber(e.target.value)} className="w-32" />
                </div>
                <Button onClick={handleAddOrUpdateFloor} disabled={!floorNumber}>
                  {editingFloorId ? "Update" : "Add"}
                </Button>
                <Button variant="outline" onClick={() => { setShowAddFloorForm(false); setFloorNumber(""); }}>Cancel</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floor Plan Designer */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Floor Plan Designer</CardTitle></CardHeader>
        <CardContent>
          <FloorPlanDesigner
            cabinId={cabinId || ""}
            roomWidth={roomWidth}
            roomHeight={roomHeight}
            gridSize={gridSize}
            seats={seats}
            sections={sections}
            roomElements={roomElements}
            onRoomDimensionsChange={(w, h, g) => { setRoomWidth(w); setRoomHeight(h); setGridSize(g); }}
            onSeatsChange={setSeats}
            onSectionsChange={setSections}
            onRoomElementsChange={setRoomElements}
            onSeatSelect={seat => { setSelectedSeat(seat); if (seat) setPrice(seat.price); }}
            selectedSeat={selectedSeat}
            onSave={handleSave}
            onGenerateSeatsForSection={handleGenerateSeatsForSection}
            onDeleteSeat={handleDeleteSeat}
            onAddSeatToSection={handleAddSeatToSection}
            onDeleteSectionWithSeats={handleDeleteSectionWithSeats}
            onPlaceSeat={handlePlaceSeat}
            layoutImage={layoutImage}
            layoutImageOpacity={layoutImageOpacity}
            onLayoutImageChange={setLayoutImage}
            onLayoutImageOpacityChange={setLayoutImageOpacity}
            isSaving={isSaving}
          />
        </CardContent>
      </Card>

      {/* Selected seat details */}
      {selectedSeat && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Seat #{selectedSeat.number} Details</CardTitle>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteSeat(selectedSeat._id)}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Seat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Label className={selectedSeat.isAvailable ? "text-emerald-600" : "text-destructive"}>
                    {selectedSeat.isAvailable ? "Available" : "Unavailable"}
                  </Label>
                  <Switch checked={selectedSeat.isAvailable} onCheckedChange={handleToggleSeatAvailability} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Price (₹/month)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input type="number" className="w-28" value={price} onChange={e => setPrice(+e.target.value)} />
                  <Button size="sm" onClick={handlePriceUpdate}>Update</Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Position</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  X: {selectedSeat.position.x}, Y: {selectedSeat.position.y}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SeatManagement;
