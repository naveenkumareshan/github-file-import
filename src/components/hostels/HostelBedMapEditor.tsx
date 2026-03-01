import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { hostelBedCategoryService, HostelBedCategory } from '@/api/hostelBedCategoryService';
import { BedDouble, Plus, Trash2, Layers, Settings, Lock, Unlock, X, CheckSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/utils/currency';

interface HostelBedMapEditorProps {
  hostelId: string;
}

interface BedData {
  id: string;
  bed_number: number;
  is_available: boolean;
  is_blocked: boolean;
  block_reason: string | null;
  room_id: string;
  sharing_option_id: string;
  category: string | null;
  price_override: number | null;
  sharingType?: string;
  sharingPrice?: number;
  occupantName?: string;
}

interface RoomGroup {
  roomId: string;
  roomNumber: string;
  roomCategory: string;
  floor: number;
  sharingOptions: any[];
  beds: BedData[];
}

export const HostelBedMapEditor: React.FC<HostelBedMapEditorProps> = ({ hostelId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [floorData, setFloorData] = useState<Record<number, RoomGroup[]>>({});
  const [categories, setCategories] = useState<HostelBedCategory[]>([]);
  const [selectedBed, setSelectedBed] = useState<BedData | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addBedDialogOpen, setAddBedDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit bed form state
  const [editCategory, setEditCategory] = useState<string>('');
  const [editPriceOverride, setEditPriceOverride] = useState<string>('');
  const [editBlockReason, setEditBlockReason] = useState('');
  const [editAmenities, setEditAmenities] = useState<string[]>([]);

  // Add bed form state
  const [addRoomId, setAddRoomId] = useState('');
  const [addSharingOptionId, setAddSharingOptionId] = useState('');
  const [addCount, setAddCount] = useState('1');
  const [addCategory, setAddCategory] = useState<string>('');
  const [addAmenities, setAddAmenities] = useState<string[]>([]);

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrice, setNewCatPrice] = useState('0');

  const BED_AMENITY_OPTIONS = [
    'Attached Washroom', 'Study Table', 'Wardrobe', 'Bookshelf',
    'Power Socket', 'Fan', 'AC', 'Window Side'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catResult] = await Promise.all([
        hostelBedCategoryService.getCategories(hostelId),
      ]);
      if (catResult.success) setCategories(catResult.data);

      const { data: rooms } = await supabase
        .from('hostel_rooms')
        .select('id, room_number, floor, category')
        .eq('hostel_id', hostelId)
        .eq('is_active', true)
        .order('floor')
        .order('room_number');

      if (!rooms?.length) { setFloorData({}); setLoading(false); return; }

      const roomIds = rooms.map(r => r.id);

      const { data: sharingOptions } = await supabase
        .from('hostel_sharing_options')
        .select('*')
        .in('room_id', roomIds)
        .eq('is_active', true);

      const { data: beds } = await supabase
        .from('hostel_beds')
        .select('*, hostel_sharing_options(type, price_monthly)')
        .in('room_id', roomIds)
        .order('bed_number');

      const { data: bookings } = await supabase
        .from('hostel_bookings')
        .select('bed_id, profiles:user_id(name)')
        .eq('hostel_id', hostelId)
        .in('status', ['confirmed', 'pending']);

      const bookingMap = new Map<string, string>();
      bookings?.forEach((b: any) => {
        bookingMap.set(b.bed_id, b.profiles?.name || 'Occupied');
      });

      const grouped: Record<number, RoomGroup[]> = {};
      rooms.forEach(room => {
        const floor = room.floor;
        if (!grouped[floor]) grouped[floor] = [];

        const roomSharingOpts = (sharingOptions || []).filter(s => s.room_id === room.id);
        const roomBeds = (beds || [])
          .filter(b => b.room_id === room.id)
          .map(b => ({
            id: b.id,
            bed_number: b.bed_number,
            is_available: b.is_available,
            is_blocked: b.is_blocked,
            block_reason: b.block_reason,
            room_id: b.room_id,
            sharing_option_id: b.sharing_option_id,
            category: (b as any).category || null,
            price_override: (b as any).price_override || null,
            amenities: (b as any).amenities || [],
            sharingType: (b as any).hostel_sharing_options?.type || '',
            sharingPrice: (b as any).hostel_sharing_options?.price_monthly || 0,
            occupantName: bookingMap.get(b.id) || undefined,
          }));

        grouped[floor].push({
          roomId: room.id,
          roomNumber: room.room_number,
          roomCategory: room.category,
          floor: room.floor,
          sharingOptions: roomSharingOpts,
          beds: roomBeds,
        });
      });

      setFloorData(grouped);
    } catch (error) {
      console.error('Error fetching bed map editor data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [hostelId]);

  const handleBedClick = (bed: BedData) => {
    setSelectedBed(bed);
    setEditCategory(bed.category || '');
    setEditPriceOverride(bed.price_override?.toString() || '');
    setEditBlockReason(bed.block_reason || '');
    setEditAmenities((bed as any).amenities || []);
    setEditDialogOpen(true);
  };

  const handleSaveBed = async () => {
    if (!selectedBed) return;
    setSaving(true);
    try {
      const updates: any = {
        category: editCategory || null,
        price_override: editPriceOverride ? Number(editPriceOverride) : null,
        amenities: editAmenities,
      };
      const { error } = await supabase
        .from('hostel_beds')
        .update(updates)
        .eq('id', selectedBed.id);
      if (error) throw error;
      toast({ title: 'Bed updated' });
      setEditDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedBed) return;
    setSaving(true);
    try {
      const newBlocked = !selectedBed.is_blocked;
      const { error } = await supabase
        .from('hostel_beds')
        .update({
          is_blocked: newBlocked,
          block_reason: newBlocked ? editBlockReason : null,
        })
        .eq('id', selectedBed.id);
      if (error) throw error;
      toast({ title: newBlocked ? 'Bed blocked' : 'Bed unblocked' });
      setEditDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBed = async () => {
    if (!selectedBed) return;
    if (selectedBed.occupantName) {
      toast({ title: 'Cannot delete', description: 'Bed has an active booking', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('hostel_beds').delete().eq('id', selectedBed.id);
      if (error) throw error;
      toast({ title: 'Bed deleted' });
      setEditDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBeds = async () => {
    if (!addRoomId || !addSharingOptionId || !addCount) return;
    setSaving(true);
    try {
      // Get max bed number for this room
      const { data: existing } = await supabase
        .from('hostel_beds')
        .select('bed_number')
        .eq('room_id', addRoomId)
        .order('bed_number', { ascending: false })
        .limit(1);
      
      let startNum = (existing?.[0]?.bed_number || 0) + 1;
      const count = parseInt(addCount);
      const beds = [];
      for (let i = 0; i < count; i++) {
        beds.push({
          room_id: addRoomId,
          sharing_option_id: addSharingOptionId,
          bed_number: startNum + i,
          category: addCategory || null,
          amenities: addAmenities,
        });
      }

      const { error } = await supabase.from('hostel_beds').insert(beds);
      if (error) throw error;
      toast({ title: `${count} bed(s) added` });
      setAddBedDialogOpen(false);
      setAddCount('1');
      setAddCategory('');
      setAddAmenities([]);
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      const result = await hostelBedCategoryService.createCategory(hostelId, newCatName, Number(newCatPrice) || 0);
      if (!result.success) throw new Error('Failed');
      toast({ title: 'Category added' });
      setNewCatName('');
      setNewCatPrice('0');
      fetchData();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat) {
      const { count } = await supabase
        .from('hostel_beds')
        .select('id', { count: 'exact', head: true })
        .eq('category', cat.name);
      if (count && count > 0) {
        toast({ title: 'Cannot delete', description: `Delete all ${count} bed(s) with category "${cat.name}" first.`, variant: 'destructive' });
        return;
      }
    }
    const result = await hostelBedCategoryService.deleteCategory(id);
    if (result.success) {
      toast({ title: 'Category deleted' });
      fetchData();
    }
  };

  const floors = Object.keys(floorData).map(Number).sort();
  const allRooms = Object.values(floorData).flat();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => setAddBedDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Beds
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCategoryDialogOpen(true)}>
          <Settings className="h-3.5 w-3.5 mr-1" /> Categories
        </Button>
      </div>

      {floors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No rooms configured yet</p>
        </div>
      ) : (
        <Tabs defaultValue={String(floors[0])}>
          <TabsList className="mb-4">
            {floors.map(floor => (
              <TabsTrigger key={floor} value={String(floor)} className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" /> Floor {floor}
              </TabsTrigger>
            ))}
          </TabsList>

          {floors.map(floor => (
            <TabsContent key={floor} value={String(floor)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {floorData[floor].map((room) => {
                  const totalBeds = room.beds.length;
                  const availableBeds = room.beds.filter(b => b.is_available && !b.is_blocked).length;
                  const occupancyPercent = totalBeds > 0 ? ((totalBeds - availableBeds) / totalBeds) * 100 : 0;

                  return (
                    <div key={room.roomId} className="border rounded-xl p-4 bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-semibold text-sm">Room {room.roomNumber}</span>
                          <Badge variant="outline" className="ml-2 text-[10px]">{room.roomCategory}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{availableBeds}/{totalBeds} available</span>
                      </div>
                      <Progress value={occupancyPercent} className="h-1.5 mb-3" />

                      <TooltipProvider>
                        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                          {room.beds.map((bed) => {
                            const isAvailable = bed.is_available && !bed.is_blocked;
                            const isBlocked = bed.is_blocked;

                            let bgClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100';
                            if (isBlocked) bgClass = 'bg-destructive/10 border-destructive/30 text-destructive';
                            else if (!isAvailable) bgClass = 'bg-blue-50 border-blue-400 text-blue-800';

                            return (
                              <Tooltip key={bed.id}>
                                <TooltipTrigger asChild>
                                  <button
                                    className={`flex flex-col items-center justify-center rounded-lg border p-2 text-[10px] font-bold transition-all cursor-pointer ${bgClass}`}
                                    onClick={() => handleBedClick(bed)}
                                  >
                                    <BedDouble className="h-3.5 w-3.5 mb-0.5" />
                                    {bed.bed_number}
                                    {bed.category && (
                                      <span className="text-[8px] font-normal opacity-70 mt-0.5">{bed.category}</span>
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs space-y-0.5">
                                    <p className="font-bold">Bed #{bed.bed_number}</p>
                                    {bed.sharingType && <p>Type: {bed.sharingType}</p>}
                                    {bed.category && <p>Category: {bed.category}</p>}
                                    <p>Price: {bed.price_override ? formatCurrency(bed.price_override) : formatCurrency(bed.sharingPrice || 0)}/mo</p>
                                    <p>{isBlocked ? '🚫 Blocked' : isAvailable ? '✅ Available' : '👤 Occupied'}</p>
                                    {bed.occupantName && <p>Guest: {bed.occupantName}</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </TooltipProvider>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[11px] pt-3 border-t">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-emerald-400 bg-emerald-50" /><span>Available</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-blue-400 bg-blue-50" /><span>Occupied</span></div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-destructive/30 bg-destructive/10" /><span>Blocked</span></div>
      </div>

      {/* ─── Edit Bed Dialog ─── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Bed #{selectedBed?.bed_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name} (+{formatCurrency(cat.price_adjustment)})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price Override (₹/month)</Label>
              <Input type="number" value={editPriceOverride} onChange={e => setEditPriceOverride(e.target.value)} placeholder="Uses sharing option price" className="mt-1" />
              {selectedBed && <p className="text-xs text-muted-foreground mt-1">Default: {formatCurrency(selectedBed.sharingPrice || 0)}/mo</p>}
            </div>
            {/* Amenities */}
            <div>
              <Label>Amenities</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {BED_AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox
                      checked={editAmenities.includes(amenity)}
                      onCheckedChange={(checked) => {
                        setEditAmenities(prev => checked ? [...prev, amenity] : prev.filter(a => a !== amenity));
                      }}
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
            <Separator />
            <div>
              <Label>Block Reason</Label>
              <Input value={editBlockReason} onChange={e => setEditBlockReason(e.target.value)} placeholder="Reason for blocking" className="mt-1" />
              <Button size="sm" variant={selectedBed?.is_blocked ? 'default' : 'destructive'} className="mt-2 w-full" onClick={handleToggleBlock} disabled={saving}>
                {selectedBed?.is_blocked ? <><Unlock className="h-3.5 w-3.5 mr-1" /> Unblock</> : <><Lock className="h-3.5 w-3.5 mr-1" /> Block Bed</>}
              </Button>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDeleteBed} disabled={saving}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
            <Button size="sm" onClick={handleSaveBed} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add Beds Dialog ─── */}
      <Dialog open={addBedDialogOpen} onOpenChange={setAddBedDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Beds</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Room</Label>
              <Select value={addRoomId} onValueChange={(v) => { setAddRoomId(v); setAddSharingOptionId(''); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  {allRooms.map(r => (
                    <SelectItem key={r.roomId} value={r.roomId}>Room {r.roomNumber} (Floor {r.floor})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {addRoomId && (
              <div>
                <Label>Sharing Option</Label>
                <Select value={addSharingOptionId} onValueChange={setAddSharingOptionId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select sharing type" /></SelectTrigger>
                  <SelectContent>
                    {allRooms.find(r => r.roomId === addRoomId)?.sharingOptions.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.type} ({formatCurrency(s.price_monthly)}/mo)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Category</Label>
              <Select value={addCategory} onValueChange={setAddCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Amenities for new beds */}
            <div>
              <Label>Amenities</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {BED_AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <Checkbox
                      checked={addAmenities.includes(amenity)}
                      onCheckedChange={(checked) => {
                        setAddAmenities(prev => checked ? [...prev, amenity] : prev.filter(a => a !== amenity));
                      }}
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Number of beds</Label>
              <Input type="number" min="1" max="50" value={addCount} onChange={e => setAddCount(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddBeds} disabled={saving || !addRoomId || !addSharingOptionId}>Add Beds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Category Management Dialog ─── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bed Categories</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {categories.length > 0 ? (
              categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">+{formatCurrency(cat.price_adjustment)}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCategory(cat.id)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">No categories yet</p>
            )}
            <Separator />
            <div className="flex gap-2">
              <Input placeholder="e.g. AC" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1" />
              <Input type="number" placeholder="₹" value={newCatPrice} onChange={e => setNewCatPrice(e.target.value)} className="w-20" />
              <Button size="sm" onClick={handleAddCategory} disabled={saving || !newCatName.trim()}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
