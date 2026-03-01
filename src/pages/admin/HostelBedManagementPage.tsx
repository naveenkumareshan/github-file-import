import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { hostelBedCategoryService, HostelBedCategory } from '@/api/hostelBedCategoryService';
import { formatCurrency } from '@/utils/currency';
import { ArrowLeft, Plus, Trash2, Pencil, BedDouble, MapPin, Lock, Unlock, Settings, Layers, Eye, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { HostelBedPlanDesigner, DesignerBed } from '@/components/hostels/HostelBedPlanDesigner';
import { HostelBedDetailsDialog } from '@/components/admin/HostelBedDetailsDialog';

const AMENITY_OPTIONS = [
  'Attached Washroom', 'Study Table', 'Wardrobe', 'Bookshelf',
  'Power Socket', 'Fan', 'AC', 'Window Side',
];

type ViewMode = 'grid' | 'floorplan';

const HostelBedManagementPage = () => {
  const { hostelId } = useParams<{ hostelId: string }>();
  const navigate = useNavigate();

  const [hostel, setHostel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [floorData, setFloorData] = useState<Record<number, any[]>>({});
  const [categories, setCategories] = useState<HostelBedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Floor plan designer state
  const [designerBeds, setDesignerBeds] = useState<DesignerBed[]>([]);
  const [selectedDesignerBed, setSelectedDesignerBed] = useState<DesignerBed | null>(null);
  const [roomLayout, setRoomLayout] = useState<any>(null);
  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const [layoutImageOpacity, setLayoutImageOpacity] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [sharingOptions, setSharingOptions] = useState<any[]>([]);

  // Grid view state
  const [gridBeds, setGridBeds] = useState<any[]>([]);

  // Edit bed dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editBed, setEditBed] = useState<any>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editPriceOverride, setEditPriceOverride] = useState('');
  const [editBlockReason, setEditBlockReason] = useState('');
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Add bed dialog
  const [addBedDialogOpen, setAddBedDialogOpen] = useState(false);
  const [addRoomIdInDialog, setAddRoomIdInDialog] = useState('');
  const [addSharingOptionId, setAddSharingOptionId] = useState('');
  const [addCount, setAddCount] = useState('1');
  const [addCategory, setAddCategory] = useState('');
  const [addAmenities, setAddAmenities] = useState<string[]>([]);
  const [addDialogSharingOptions, setAddDialogSharingOptions] = useState<any[]>([]);

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatPrice, setNewCatPrice] = useState('0');

  // Bed details dialog
  const [detailsBedId, setDetailsBedId] = useState<string | null>(null);
  const [detailsBedNumber, setDetailsBedNumber] = useState(0);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (hostelId) fetchAll();
  }, [hostelId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: h } = await supabase.from('hostels').select('*').eq('id', hostelId).single();
      setHostel(h);

      const catResult = await hostelBedCategoryService.getCategories(hostelId!);
      if (catResult.success) setCategories(catResult.data);

      const { data: roomsData } = await supabase
        .from('hostel_rooms')
        .select('id, room_number, floor, category, room_width, room_height, layout_image, layout_image_opacity')
        .eq('hostel_id', hostelId)
        .eq('is_active', true)
        .order('floor')
        .order('room_number');

      setRooms(roomsData || []);
      if (roomsData?.length && !selectedRoomId) {
        setSelectedRoomId(roomsData[0].id);
      }

      if (roomsData?.length) {
        const roomIds = roomsData.map(r => r.id);

        const { data: opts } = await supabase
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
        bookings?.forEach((b: any) => bookingMap.set(b.bed_id, b.profiles?.name || 'Occupied'));

        const grouped: Record<number, any[]> = {};
        roomsData.forEach(room => {
          if (!grouped[room.floor]) grouped[room.floor] = [];
          const roomOpts = (opts || []).filter(s => s.room_id === room.id);
          const roomBeds = (beds || []).filter(b => b.room_id === room.id).map(b => ({
            id: b.id, bed_number: b.bed_number, is_available: b.is_available, is_blocked: b.is_blocked,
            block_reason: b.block_reason, room_id: b.room_id, sharing_option_id: b.sharing_option_id,
            category: b.category, price_override: b.price_override, position_x: b.position_x, position_y: b.position_y,
            amenities: b.amenities || [],
            sharingType: b.hostel_sharing_options?.type || '', sharingPrice: b.hostel_sharing_options?.price_monthly || 0,
            occupantName: bookingMap.get(b.id) || undefined,
          }));
          grouped[room.floor].push({ roomId: room.id, roomNumber: room.room_number, roomCategory: room.category, floor: room.floor, sharingOptions: roomOpts, beds: roomBeds });
        });
        setFloorData(grouped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Load designer beds when room changes
  useEffect(() => {
    if (!selectedRoomId || viewMode !== 'floorplan') return;
    const loadDesignerData = async () => {
      const room = rooms.find(r => r.id === selectedRoomId);
      setRoomLayout(room);
      setLayoutImage(room?.layout_image || null);
      setLayoutImageOpacity(room?.layout_image_opacity ?? 30);

      const { data: opts } = await supabase
        .from('hostel_sharing_options')
        .select('id, type, price_monthly')
        .eq('room_id', selectedRoomId)
        .eq('is_active', true);
      setSharingOptions(opts || []);

      const { data: beds } = await supabase
        .from('hostel_beds')
        .select('*, hostel_sharing_options(type, price_monthly)')
        .eq('room_id', selectedRoomId)
        .order('bed_number');

      const { data: bookings } = await supabase
        .from('hostel_bookings')
        .select('bed_id, profiles:user_id(name)')
        .eq('hostel_id', hostelId)
        .in('status', ['confirmed', 'pending']);

      const bookingMap = new Map<string, string>();
      bookings?.forEach((b: any) => bookingMap.set(b.bed_id, b.profiles?.name || 'Occupied'));

      setDesignerBeds((beds || []).map(b => ({
        id: b.id, bed_number: b.bed_number, position_x: b.position_x || 0, position_y: b.position_y || 0,
        is_available: b.is_available, is_blocked: b.is_blocked, category: b.category, price_override: b.price_override,
        sharing_option_id: b.sharing_option_id, sharingType: b.hostel_sharing_options?.type,
        sharingPrice: b.hostel_sharing_options?.price_monthly, occupantName: bookingMap.get(b.id),
      })));
    };
    loadDesignerData();
  }, [selectedRoomId, viewMode]);

  // Grid bed click handler
  const handleGridBedClick = (bed: any) => {
    setEditBed(bed);
    setEditCategory(bed.category || '');
    setEditPriceOverride(bed.price_override?.toString() || '');
    setEditBlockReason(bed.block_reason || '');
    setEditAmenities(bed.amenities || []);
    setEditDialogOpen(true);
  };

  const handleSaveBed = async () => {
    if (!editBed) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('hostel_beds').update({
        category: editCategory || null,
        price_override: editPriceOverride ? Number(editPriceOverride) : null,
        amenities: editAmenities,
      }).eq('id', editBed.id);
      if (error) throw error;
      toast({ title: 'Bed updated' });
      setEditDialogOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleToggleBlock = async () => {
    if (!editBed) return;
    setSaving(true);
    try {
      const newBlocked = !editBed.is_blocked;
      const { error } = await supabase.from('hostel_beds').update({
        is_blocked: newBlocked, block_reason: newBlocked ? editBlockReason : null,
      }).eq('id', editBed.id);
      if (error) throw error;
      toast({ title: newBlocked ? 'Bed blocked' : 'Bed unblocked' });
      setEditDialogOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDeleteBed = async (bedId: string) => {
    try {
      const { error } = await supabase.from('hostel_beds').delete().eq('id', bedId);
      if (error) throw error;
      toast({ title: 'Bed deleted' });
      setEditDialogOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Load sharing options for the selected room in add dialog
  const loadAddDialogSharingOptions = async (roomId: string) => {
    const { data } = await supabase
      .from('hostel_sharing_options')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_active', true);
    setAddDialogSharingOptions(data || []);
  };

  const handleAddRoomChange = (roomId: string) => {
    setAddRoomIdInDialog(roomId);
    setAddSharingOptionId('');
    loadAddDialogSharingOptions(roomId);
  };

  const handleAddBeds = async () => {
    const targetRoomId = addRoomIdInDialog || selectedRoomId;
    if (!targetRoomId || !addSharingOptionId || !addCount) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('hostel_beds')
        .select('bed_number')
        .eq('room_id', targetRoomId)
        .order('bed_number', { ascending: false })
        .limit(1);
      let startNum = (existing?.[0]?.bed_number || 0) + 1;
      const count = parseInt(addCount);
      const beds = [];
      for (let i = 0; i < count; i++) {
        beds.push({
          room_id: targetRoomId,
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
      setAddRoomIdInDialog('');
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  // Floor plan save
  const handleSaveLayout = async () => {
    if (!selectedRoomId) return;
    setIsSaving(true);
    try {
      await supabase.from('hostel_rooms').update({
        layout_image: layoutImage, layout_image_opacity: layoutImageOpacity,
      }).eq('id', selectedRoomId);

      const updates = designerBeds.map(b =>
        supabase.from('hostel_beds').update({ position_x: b.position_x, position_y: b.position_y }).eq('id', b.id)
      );
      await Promise.all(updates);
      toast({ title: 'Layout saved successfully' });
    } catch (e) {
      toast({ title: 'Error saving layout', variant: 'destructive' });
    } finally { setIsSaving(false); }
  };

  const handlePlaceBed = async (position: { x: number; y: number }, number: number, sharingOptionId: string, category: string) => {
    if (!selectedRoomId) return;
    try {
      const { data, error } = await supabase.from('hostel_beds').insert({
        room_id: selectedRoomId, sharing_option_id: sharingOptionId, bed_number: number,
        category: category && category !== 'none' ? category : null,
        position_x: position.x, position_y: position.y,
      }).select('*, hostel_sharing_options(type, price_monthly)').single();
      if (error) throw error;
      if (data) {
        setDesignerBeds(prev => [...prev, {
          id: data.id, bed_number: data.bed_number, position_x: data.position_x, position_y: data.position_y,
          is_available: data.is_available, is_blocked: data.is_blocked, category: data.category,
          price_override: data.price_override, sharing_option_id: data.sharing_option_id,
          sharingType: data.hostel_sharing_options?.type, sharingPrice: data.hostel_sharing_options?.price_monthly,
        }]);
        toast({ title: `Bed #${number} placed` });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleBedMove = async (bedId: string, position: { x: number; y: number }) => {
    await supabase.from('hostel_beds').update({ position_x: position.x, position_y: position.y }).eq('id', bedId);
  };

  const handleDeleteDesignerBed = async (bedId: string) => {
    try {
      await supabase.from('hostel_beds').delete().eq('id', bedId);
      setDesignerBeds(prev => prev.filter(b => b.id !== bedId));
      toast({ title: 'Bed deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Category CRUD
  const handleAddCategory = async () => {
    if (!newCatName.trim() || !hostelId) return;
    setSaving(true);
    try {
      const result = await hostelBedCategoryService.createCategory(hostelId, newCatName, Number(newCatPrice) || 0);
      if (!result.success) throw new Error('Failed');
      toast({ title: 'Category added' });
      setNewCatName(''); setNewCatPrice('0');
      const catResult = await hostelBedCategoryService.getCategories(hostelId);
      if (catResult.success) setCategories(catResult.data);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    const result = await hostelBedCategoryService.deleteCategory(id);
    if (result.success) {
      toast({ title: 'Category deleted' });
      if (hostelId) {
        const catResult = await hostelBedCategoryService.getCategories(hostelId);
        if (catResult.success) setCategories(catResult.data);
      }
    }
  };

  const toggleAmenity = (amenity: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const floors = Object.keys(floorData).map(Number).sort();

  if (loading && !hostel) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold">{hostel?.name}</h1>
          <span className="text-xs text-muted-foreground">{hostel?.gender} • {hostel?.stay_type}</span>
        </div>
      </div>

      {/* Categories + Rooms row */}
      <div className="border rounded-lg p-3 flex flex-col lg:flex-row gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Categories</span>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCategoryDialogOpen(true)}><Settings className="h-3 w-3 mr-1" /> Manage</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-1 border rounded px-2 py-1 text-xs">
                <span className="font-medium">{cat.name}</span>
                <span className="text-muted-foreground">+₹{cat.price_adjustment}</span>
              </div>
            ))}
            {categories.length === 0 && <span className="text-xs text-muted-foreground">No categories</span>}
          </div>
        </div>
        <div className="hidden lg:block w-px bg-border" />
        <div className="min-w-0">
          <span className="text-sm font-medium">Rooms</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {rooms.map(room => (
              <button
                key={room.id}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedRoomId === room.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border'}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                Room {room.room_number} (F{room.floor})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View toggle + Add Beds button */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex bg-muted rounded-lg p-0.5">
          <button className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => setViewMode('grid')}>
            <LayoutGrid className="h-3.5 w-3.5 inline mr-1" />Box Grid
          </button>
          <button className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === 'floorplan' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => setViewMode('floorplan')}>
            <MapIcon className="h-3.5 w-3.5 inline mr-1" />Floor Plan
          </button>
        </div>
        <Button size="sm" variant="outline" onClick={() => {
          setAddSharingOptionId(''); setAddCategory(''); setAddAmenities([]);
          setAddRoomIdInDialog(selectedRoomId);
          loadAddDialogSharingOptions(selectedRoomId);
          setAddBedDialogOpen(true);
        }}><Plus className="h-3.5 w-3.5 mr-1" />Add Beds</Button>
      </div>

      {viewMode === 'grid' ? (
        /* Box Grid View */
        <div>
          {floors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Layers className="h-10 w-10 mx-auto mb-2 opacity-50" /><p>No rooms configured</p></div>
          ) : (
            <Tabs defaultValue={String(floors[0])}>
              <TabsList className="mb-4">
                {floors.map(floor => <TabsTrigger key={floor} value={String(floor)}><Layers className="h-3.5 w-3.5 mr-1" />Floor {floor}</TabsTrigger>)}
              </TabsList>
              {floors.map(floor => (
                <TabsContent key={floor} value={String(floor)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {floorData[floor].map(room => {
                      const totalBeds = room.beds.length;
                      const availBeds = room.beds.filter((b: any) => b.is_available && !b.is_blocked).length;
                      const pct = totalBeds > 0 ? ((totalBeds - availBeds) / totalBeds) * 100 : 0;
                      return (
                        <div key={room.roomId} className="border rounded-xl p-4 bg-card">
                          <div className="flex items-center justify-between mb-3">
                            <div><span className="font-semibold text-sm">Room {room.roomNumber}</span><Badge variant="outline" className="ml-2 text-[10px]">{room.roomCategory}</Badge></div>
                            <span className="text-xs text-muted-foreground">{availBeds}/{totalBeds} available</span>
                          </div>
                          <Progress value={pct} className="h-1.5 mb-3" />
                          <TooltipProvider>
                            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                              {room.beds.map((bed: any) => {
                                const isAvail = bed.is_available && !bed.is_blocked;
                                const isBlocked = bed.is_blocked;
                                let bgClass = 'bg-emerald-50 border-emerald-400 text-emerald-800 hover:bg-emerald-100';
                                if (isBlocked) bgClass = 'bg-destructive/10 border-destructive/30 text-destructive';
                                else if (!isAvail) bgClass = 'bg-blue-50 border-blue-400 text-blue-800';
                                return (
                                  <Tooltip key={bed.id}>
                                    <TooltipTrigger asChild>
                                      <button className={`flex flex-col items-center justify-center rounded-lg border p-2 text-[10px] font-bold cursor-pointer ${bgClass}`} onClick={() => handleGridBedClick(bed)}>
                                        <BedDouble className="h-3.5 w-3.5 mb-0.5" />
                                        {bed.bed_number}
                                        {bed.category && <span className="text-[8px] font-normal opacity-70 mt-0.5">{bed.category}</span>}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="text-xs space-y-0.5">
                                        <p className="font-bold">Bed #{bed.bed_number}</p>
                                        {bed.sharingType && <p>Type: {bed.sharingType}</p>}
                                        {bed.category && <p>Category: {bed.category}</p>}
                                        <p>Price: {bed.price_override ? formatCurrency(bed.price_override) : formatCurrency(bed.sharingPrice || 0)}/mo</p>
                                        <p>{isBlocked ? '🚫 Blocked' : isAvail ? '✅ Available' : '👤 Occupied'}</p>
                                        {bed.occupantName && <p>Guest: {bed.occupantName}</p>}
                                        {bed.amenities?.length > 0 && <p>Amenities: {bed.amenities.join(', ')}</p>}
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
          <div className="flex items-center justify-center gap-4 text-[11px] pt-3 border-t mt-4">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-emerald-400 bg-emerald-50" /><span>Available</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-blue-400 bg-blue-50" /><span>Occupied</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-destructive/30 bg-destructive/10" /><span>Blocked</span></div>
          </div>
        </div>
      ) : (
        /* Floor Plan View */
        selectedRoomId && roomLayout ? (
          <HostelBedPlanDesigner
            roomId={selectedRoomId}
            roomWidth={roomLayout?.room_width || 800}
            roomHeight={roomLayout?.room_height || 600}
            beds={designerBeds}
            onBedsChange={setDesignerBeds}
            onBedSelect={bed => {
              setSelectedDesignerBed(bed);
              if (bed) handleGridBedClick(bed);
            }}
            selectedBed={selectedDesignerBed}
            onSave={handleSaveLayout}
            onDeleteBed={handleDeleteDesignerBed}
            onPlaceBed={handlePlaceBed}
            onBedMove={handleBedMove}
            layoutImage={layoutImage}
            layoutImageOpacity={layoutImageOpacity}
            onLayoutImageChange={setLayoutImage}
            onLayoutImageOpacityChange={setLayoutImageOpacity}
            isSaving={isSaving}
            sharingOptions={sharingOptions}
            categories={categories}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">Select a room to view the floor plan</div>
        )
      )}

      {/* Edit Bed Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Bed #{editBed?.bed_number}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name} (+{formatCurrency(cat.price_adjustment)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price Override (₹/month)</Label>
              <Input type="number" value={editPriceOverride} onChange={e => setEditPriceOverride(e.target.value)} placeholder="Uses sharing option price" className="mt-1" />
              {editBed && <p className="text-xs text-muted-foreground mt-1">Default: {formatCurrency(editBed.sharingPrice || 0)}/mo</p>}
            </div>
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox
                      checked={editAmenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity, editAmenities, setEditAmenities)}
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
              <Button size="sm" variant={editBed?.is_blocked ? 'default' : 'destructive'} className="mt-2 w-full" onClick={handleToggleBlock} disabled={saving}>
                {editBed?.is_blocked ? <><Unlock className="h-3.5 w-3.5 mr-1" /> Unblock</> : <><Lock className="h-3.5 w-3.5 mr-1" /> Block Bed</>}
              </Button>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setDetailsBedId(editBed?.id); setDetailsBedNumber(editBed?.bed_number || 0); setDetailsDialogOpen(true); }}>
              <Eye className="h-3.5 w-3.5 mr-1" /> View Details
            </Button>
            <Button variant="destructive" size="sm" onClick={() => editBed && handleDeleteBed(editBed.id)} disabled={saving || editBed?.occupantName}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
            <Button size="sm" onClick={handleSaveBed} disabled={saving}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Beds Dialog */}
      <Dialog open={addBedDialogOpen} onOpenChange={setAddBedDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Beds</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Room</Label>
              <Select value={addRoomIdInDialog} onValueChange={handleAddRoomChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select room" /></SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>Room {room.room_number} (F{room.floor})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sharing Option</Label>
              <Select value={addSharingOptionId} onValueChange={setAddSharingOptionId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select sharing type" /></SelectTrigger>
                <SelectContent>
                  {addDialogSharingOptions.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.type} ({formatCurrency(s.price_monthly)}/mo)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={addCategory} onValueChange={setAddCategory}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox
                      checked={addAmenities.includes(amenity)}
                      onCheckedChange={() => toggleAmenity(amenity, addAmenities, setAddAmenities)}
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
          <DialogFooter><Button onClick={handleAddBeds} disabled={saving || !addSharingOptionId}>Add Beds</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bed Categories</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {categories.length > 0 ? categories.map(cat => (
              <div key={cat.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div><span className="text-sm font-medium">{cat.name}</span><span className="text-xs text-muted-foreground ml-2">+{formatCurrency(cat.price_adjustment)}</span></div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-2">No categories yet</p>}
            <Separator />
            <div className="flex gap-2">
              <Input placeholder="e.g. AC" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1" />
              <Input type="number" placeholder="₹" value={newCatPrice} onChange={e => setNewCatPrice(e.target.value)} className="w-20" />
              <Button size="sm" onClick={handleAddCategory} disabled={saving || !newCatName.trim()}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bed Details Dialog */}
      <HostelBedDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        bedId={detailsBedId}
        bedNumber={detailsBedNumber}
        hostelName={hostel?.name}
      />
    </div>
  );
};

export default HostelBedManagementPage;
