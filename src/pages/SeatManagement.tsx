import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { adminCabinsService } from "@/api/adminCabinsService";
import { adminSeatsService, SeatData } from "@/api/adminSeatsService";
import { seatCategoryService, SeatCategory } from "@/api/seatCategoryService";
import { ArrowLeft, Building, Plus, Trash2, Settings, Pencil } from "lucide-react";
import { FloorPlanDesigner, FloorPlanSeat } from "@/components/seats/FloorPlanDesigner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

const SeatManagement = () => {
  const { cabinId } = useParams<{ cabinId: string }>();
  const navigate = useNavigate();

  const [cabin, setCabin] = useState<any>(null);
  const [seats, setSeats] = useState<FloorPlanSeat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<FloorPlanSeat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const [layoutImageOpacity, setLayoutImageOpacity] = useState(30);

  const [roomWidth, setRoomWidth] = useState(800);
  const [roomHeight, setRoomHeight] = useState(600);

  // Floors
  const [floors, setFloors] = useState<any[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [floorNumber, setFloorNumber] = useState("");
  const [editingFloorId, setEditingFloorId] = useState<number | null>(null);
  const [showAddFloorForm, setShowAddFloorForm] = useState(false);

  // Categories
  const [categories, setCategories] = useState<SeatCategory[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SeatCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catPrice, setCatPrice] = useState(0);

  useEffect(() => {
    if (cabinId) {
      fetchCabinData(cabinId);
      fetchCategories(cabinId);
    }
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
        setLayoutImage(d.layout_image || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async (id: string, floor: number) => {
    try {
      setLoading(true);
      const res = await adminSeatsService.getSeatsByCabin(id, floor.toString());
      if (res.success) setSeats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (id: string) => {
    const res = await seatCategoryService.getCategories(id);
    if (res.success) setCategories(res.data);
  };

  const handleSave = async () => {
    if (!cabinId) return;
    setIsSaving(true);
    try {
      await adminCabinsService.updateCabinLayout(cabinId, [], roomWidth, roomHeight, 20, [], layoutImage);
      const seatsToUpdate = seats.map(s => ({ _id: s._id, position: s.position }));
      await adminSeatsService.updateSeatPositions(seatsToUpdate);
      toast({ title: "Layout saved successfully" });
    } catch (e) {
      toast({ title: "Error saving layout", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

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

  const handlePlaceSeat = async (position: { x: number; y: number }, number: number, price: number, category: string) => {
    if (!cabinId) return;
    try {
      const seatData: SeatData = {
        number, floor: selectedFloor, cabinId, price, position,
        isAvailable: true, isHotSelling: false, category,
      };
      const res = await adminSeatsService.createSeat(seatData);
      if (res.success && res.data) {
        setSeats(prev => [...prev, res.data]);
        toast({ title: `Seat #${number} (${category}) placed` });
      }
    } catch (e) {
      toast({ title: "Error placing seat", variant: "destructive" });
    }
  };

  const handleSeatMove = async (seatId: string, position: { x: number; y: number }) => {
    try {
      await adminSeatsService.updateSeatPositions([{ _id: seatId, position }]);
    } catch (e) {
      console.error('Error saving seat position:', e);
    }
  };

  const handleSeatUpdate = async (seatId: string, updates: { category?: string; price?: number; isAvailable?: boolean }) => {
    try {
      const res = await adminSeatsService.updateSeat(seatId, updates);
      if (res.success) {
        setSeats(seats.map(s => s._id === seatId ? { ...s, ...updates } : s));
        toast({ title: "Seat updated" });
      }
    } catch (e) {
      toast({ title: "Error updating seat", variant: "destructive" });
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
        floorId: editingFloorId, number: floorNumber,
      });
      if (res.success) {
        setFloors(res.data.floors);
        toast({ title: editingFloorId ? "Floor updated" : "Floor added" });
        setFloorNumber(""); setEditingFloorId(null); setShowAddFloorForm(false);
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  // ── Category CRUD ──
  const openAddCategory = () => {
    setEditingCategory(null); setCatName(""); setCatPrice(0); setShowCategoryDialog(true);
  };
  const openEditCategory = (cat: SeatCategory) => {
    setEditingCategory(cat); setCatName(cat.name); setCatPrice(cat.price); setShowCategoryDialog(true);
  };
  const handleSaveCategory = async () => {
    if (!catName.trim() || !cabinId) return;
    if (editingCategory) {
      const res = await seatCategoryService.updateCategory(editingCategory.id, { name: catName, price: catPrice });
      if (res.success) {
        toast({ title: "Category updated" });
        fetchCategories(cabinId);
      }
    } else {
      const res = await seatCategoryService.createCategory(cabinId, catName, catPrice);
      if (res.success) {
        toast({ title: "Category added" });
        fetchCategories(cabinId);
      }
    }
    setShowCategoryDialog(false);
  };
  const handleDeleteCategory = async (id: string) => {
    if (!cabinId) return;
    const res = await seatCategoryService.deleteCategory(id);
    if (res.success) {
      toast({ title: "Category deleted" });
      fetchCategories(cabinId);
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

      {/* Category Management */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle className="text-lg flex items-center gap-2"><Settings className="h-4 w-4" /> Seat Categories & Pricing</CardTitle>
          <Button size="sm" variant="outline" onClick={openAddCategory}><Plus className="h-3.5 w-3.5 mr-1" /> Add Category</Button>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories yet. Add one to get started.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="border rounded-lg p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{cat.name}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditCategory(cat)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">₹{cat.price}/month</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
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
            seats={seats}
            onSeatsChange={setSeats}
            onSeatSelect={seat => { setSelectedSeat(seat); }}
            selectedSeat={selectedSeat}
            onSave={handleSave}
            onDeleteSeat={handleDeleteSeat}
            onPlaceSeat={handlePlaceSeat}
            onSeatMove={handleSeatMove}
            onSeatUpdate={handleSeatUpdate}
            layoutImage={layoutImage}
            layoutImageOpacity={layoutImageOpacity}
            onLayoutImageChange={setLayoutImage}
            onLayoutImageOpacityChange={setLayoutImageOpacity}
            isSaving={isSaving}
            categories={categories.map(c => ({ id: c.id, name: c.name, price: c.price }))}
          />
        </CardContent>
      </Card>


      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Category Name</Label>
              <Input value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. AC, Premium" />
            </div>
            <div>
              <Label>Default Price (₹/month)</Label>
              <Input type="number" min={0} value={catPrice} onChange={e => setCatPrice(+e.target.value || 0)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={!catName.trim()}>
              {editingCategory ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeatManagement;
