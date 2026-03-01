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
import { hostelFloorService, HostelFloor } from '@/api/hostelFloorService';
import { hostelSharingTypeService, HostelSharingType } from '@/api/hostelSharingTypeService';
import { formatCurrency } from '@/utils/currency';
import { ArrowLeft, Plus, Trash2, Pencil, BedDouble, Lock, Unlock, Settings, Layers, Eye, LayoutGrid, Map as MapIcon, Building, Users, Tag } from 'lucide-react';
import { HostelBedPlanDesigner, DesignerBed } from '@/components/hostels/HostelBedPlanDesigner';
import { HostelBedDetailsDialog } from '@/components/admin/HostelBedDetailsDialog';

const AMENITY_OPTIONS = [
  'Attached Bathroom', 'Common Bathroom', 'Kitchen Access', 'Study Table',
  'Wardrobe', 'Bookshelf', 'Power Socket', 'Fan', 'AC', 'Window Side',
];

type ViewMode = 'grid' | 'floorplan';

const HostelBedManagementPage = () => {
  const { hostelId } = useParams<{ hostelId: string }>();
  const navigate = useNavigate();

  const [hostel, setHostel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [floorData, setFloorData] = useState<Record<string, any[]>>({});
  const [categories, setCategories] = useState<HostelBedCategory[]>([]);
  const [floors, setFloors] = useState<HostelFloor[]>([]);
  const [sharingTypes, setSharingTypes] = useState<HostelSharingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [configTab, setConfigTab] = useState('categories');

  // Floor plan designer state
  const [designerBeds, setDesignerBeds] = useState<DesignerBed[]>([]);
  const [selectedDesignerBed, setSelectedDesignerBed] = useState<DesignerBed | null>(null);
  const [roomLayout, setRoomLayout] = useState<any>(null);
  const [layoutImage, setLayoutImage] = useState<string | null>(null);
  const [layoutImageOpacity, setLayoutImageOpacity] = useState(30);
  const [isSaving, setIsSaving] = useState(false);
  const [sharingOptions, setSharingOptions] = useState<any[]>([]);

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
  const [addPrice, setAddPrice] = useState('');

  // Category dialog
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Floor dialog
  const [floorDialogOpen, setFloorDialogOpen] = useState(false);
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorOrder, setNewFloorOrder] = useState('1');

  // Sharing type dialog
  const [sharingTypeDialogOpen, setSharingTypeDialogOpen] = useState(false);
  const [newSharingName, setNewSharingName] = useState('');
  const [newSharingCapacity, setNewSharingCapacity] = useState('1');

  // Add room dialog
  const [addRoomDialogOpen, setAddRoomDialogOpen] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newRoomFloorId, setNewRoomFloorId] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');

  // Rename room
  const [renameRoomId, setRenameRoomId] = useState<string | null>(null);
  const [renameRoomValue, setRenameRoomValue] = useState('');

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

      const [catResult, floorResult, sharingResult] = await Promise.all([
        hostelBedCategoryService.getCategories(hostelId!),
        hostelFloorService.getFloors(hostelId!),
        hostelSharingTypeService.getSharingTypes(hostelId!),
      ]);
      if (catResult.success) setCategories(catResult.data);
      if (floorResult.success) setFloors(floorResult.data);
      if (sharingResult.success) setSharingTypes(sharingResult.data);

      const { data: roomsData } = await supabase
        .from('hostel_rooms')
        .select('id, room_number, floor, category, room_width, room_height, layout_image, layout_image_opacity, floor_id, category_id, sharing_type_id')
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

        const grouped: Record<string, any[]> = {};
        roomsData.forEach(room => {
          const floorKey = room.floor_id
            ? (floorResult.success ? floorResult.data.find(f => f.id === room.floor_id)?.name || 'Unassigned' : 'Unassigned')
            : 'Unassigned';
          if (!grouped[floorKey]) grouped[floorKey] = [];
          const roomOpts = (opts || []).filter(s => s.room_id === room.id);
          const roomBeds = (beds || []).filter(b => b.room_id === room.id).map(b => ({
            id: b.id, bed_number: b.bed_number, is_available: b.is_available, is_blocked: b.is_blocked,
            block_reason: b.block_reason, room_id: b.room_id, sharing_option_id: b.sharing_option_id,
            category: b.category, price_override: b.price_override, position_x: b.position_x, position_y: b.position_y,
            amenities: b.amenities || [],
            sharingType: b.hostel_sharing_options?.type || '', sharingPrice: b.hostel_sharing_options?.price_monthly || 0,
            occupantName: bookingMap.get(b.id) || undefined,
          }));
          grouped[floorKey].push({
            roomId: room.id, roomNumber: room.room_number, roomCategory: room.category,
            floor: room.floor, sharingOptions: roomOpts, beds: roomBeds,
            categoryName: catResult.success ? catResult.data.find(c => c.id === room.category_id)?.name : undefined,
            sharingTypeName: sharingResult.success ? sharingResult.data.find(s => s.id === room.sharing_type_id)?.name : undefined,
          });
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
          price_override: addPrice ? Number(addPrice) : null,
        });
      }
      const { error } = await supabase.from('hostel_beds').insert(beds);
      if (error) throw error;
      toast({ title: `${count} bed(s) added` });
      setAddBedDialogOpen(false);
      setAddCount('1'); setAddCategory(''); setAddAmenities([]); setAddRoomIdInDialog(''); setAddPrice('');
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

  // Category CRUD - categories are labels only, no price
  const handleAddCategory = async () => {
    if (!newCatName.trim() || !hostelId) return;
    setSaving(true);
    try {
      const result = await hostelBedCategoryService.createCategory(hostelId, newCatName, 0);
      if (!result.success) throw new Error('Failed');
      toast({ title: 'Category added' });
      setNewCatName('');
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

  // Floor CRUD
  const handleAddFloor = async () => {
    if (!newFloorName.trim() || !hostelId) return;
    setSaving(true);
    try {
      const result = await hostelFloorService.createFloor(hostelId, newFloorName, Number(newFloorOrder) || 1);
      if (!result.success) throw new Error('Failed');
      toast({ title: 'Floor added' });
      setNewFloorName(''); setNewFloorOrder(String((floors.length || 0) + 1));
      const floorResult = await hostelFloorService.getFloors(hostelId);
      if (floorResult.success) setFloors(floorResult.data);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDeleteFloor = async (id: string) => {
    const result = await hostelFloorService.deleteFloor(id);
    if (result.success) {
      toast({ title: 'Floor removed' });
      if (hostelId) {
        const floorResult = await hostelFloorService.getFloors(hostelId);
        if (floorResult.success) setFloors(floorResult.data);
      }
    }
  };

  // Sharing Type CRUD
  const handleAddSharingType = async () => {
    if (!newSharingName.trim() || !hostelId) return;
    setSaving(true);
    try {
      const result = await hostelSharingTypeService.createSharingType(hostelId, newSharingName, Number(newSharingCapacity) || 1);
      if (!result.success) throw new Error('Failed');
      toast({ title: 'Sharing type added' });
      setNewSharingName(''); setNewSharingCapacity('1');
      const stResult = await hostelSharingTypeService.getSharingTypes(hostelId);
      if (stResult.success) setSharingTypes(stResult.data);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDeleteSharingType = async (id: string) => {
    const result = await hostelSharingTypeService.deleteSharingType(id);
    if (result.success) {
      toast({ title: 'Sharing type removed' });
      if (hostelId) {
        const stResult = await hostelSharingTypeService.getSharingTypes(hostelId);
        if (stResult.success) setSharingTypes(stResult.data);
      }
    }
  };

  // Add Room - no price field
  const handleAddRoom = async () => {
    if (!newRoomNumber.trim() || !newRoomFloorId || !hostelId) return;
    setSaving(true);
    try {
      const selectedFloor = floors.find(f => f.id === newRoomFloorId);
      const { error } = await supabase.from('hostel_rooms').insert({
        hostel_id: hostelId,
        room_number: newRoomNumber,
        floor: selectedFloor?.floor_order || 1,
        floor_id: newRoomFloorId,
        description: newRoomDescription || '',
      } as any);
      if (error) throw error;

      toast({ title: 'Room added' });
      setAddRoomDialogOpen(false);
      setNewRoomNumber(''); setNewRoomFloorId(''); setNewRoomDescription('');
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  // Delete room (soft-delete)
  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase.from('hostel_rooms').update({ is_active: false } as any).eq('id', roomId);
      if (error) throw error;
      toast({ title: 'Room deleted (existing bookings preserved)' });
      if (selectedRoomId === roomId) setSelectedRoomId('');
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  // Rename room
  const handleRenameRoom = async (roomId: string) => {
    if (!renameRoomValue.trim()) return;
    try {
      const { error } = await supabase.from('hostel_rooms').update({ room_number: renameRoomValue } as any).eq('id', roomId);
      if (error) throw error;
      toast({ title: 'Room renamed' });
      setRenameRoomId(null);
      setRenameRoomValue('');
      fetchAll();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const toggleAmenity = (amenity: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(prev => prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]);
  };

  const floorKeys = Object.keys(floorData).sort();

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

      {/* ═══ Configuration Panel ═══ */}
      <div className="border rounded-lg p-3">
        <Tabs value={configTab} onValueChange={setConfigTab}>
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="categories" className="text-xs"><Tag className="h-3.5 w-3.5 mr-1" />Categories</TabsTrigger>
            <TabsTrigger value="sharing" className="text-xs"><Users className="h-3.5 w-3.5 mr-1" />Sharing Types</TabsTrigger>
            <TabsTrigger value="floors" className="text-xs"><Layers className="h-3.5 w-3.5 mr-1" />Floors</TabsTrigger>
            <TabsTrigger value="rooms" className="text-xs"><Building className="h-3.5 w-3.5 mr-1" />Rooms</TabsTrigger>
          </TabsList>

          {/* Categories Tab - labels only, no price */}
          <TabsContent value="categories" className="pt-3">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Configure bed categories like AC / Non-AC. Price is set per bed.</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-1 border rounded px-2 py-1 text-xs">
                    <span className="font-medium">{cat.name}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => handleDeleteCategory(cat.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                {categories.length === 0 && <span className="text-xs text-muted-foreground">No categories yet</span>}
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input placeholder="e.g. AC" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1" />
                <Button size="sm" onClick={handleAddCategory} disabled={saving || !newCatName.trim()}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* Sharing Types Tab */}
          <TabsContent value="sharing" className="pt-3">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Configure sharing types: Single, Two Sharing, Dormitory, etc.</p>
              <div className="flex flex-wrap gap-2">
                {sharingTypes.map(st => (
                  <div key={st.id} className="flex items-center gap-1 border rounded px-2 py-1 text-xs">
                    <span className="font-medium">{st.name}</span>
                    <span className="text-muted-foreground">({st.capacity} beds)</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => handleDeleteSharingType(st.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                {sharingTypes.length === 0 && <span className="text-xs text-muted-foreground">No sharing types yet</span>}
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input placeholder="e.g. Two Sharing" value={newSharingName} onChange={e => setNewSharingName(e.target.value)} className="flex-1" />
                <Input type="number" placeholder="Capacity" value={newSharingCapacity} onChange={e => setNewSharingCapacity(e.target.value)} className="w-24" />
                <Button size="sm" onClick={handleAddSharingType} disabled={saving || !newSharingName.trim()}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* Floors Tab */}
          <TabsContent value="floors" className="pt-3">
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Create and manage floors for this hostel.</p>
              <div className="flex flex-wrap gap-2">
                {floors.map(floor => (
                  <div key={floor.id} className="flex items-center gap-1 border rounded px-2 py-1 text-xs">
                    <span className="font-medium">{floor.name}</span>
                    <span className="text-muted-foreground">(Order: {floor.floor_order})</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => handleDeleteFloor(floor.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
                {floors.length === 0 && <span className="text-xs text-muted-foreground">No floors yet</span>}
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input placeholder="e.g. Ground Floor" value={newFloorName} onChange={e => setNewFloorName(e.target.value)} className="flex-1" />
                <Input type="number" placeholder="Order" value={newFloorOrder} onChange={e => setNewFloorOrder(e.target.value)} className="w-20" />
                <Button size="sm" onClick={handleAddFloor} disabled={saving || !newFloorName.trim()}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* Rooms Tab - with delete + rename, no legacy rooms */}
          <TabsContent value="rooms" className="pt-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Rooms grouped by floor. Beds & pricing configured per bed.</p>
                <Button size="sm" variant="outline" onClick={() => setAddRoomDialogOpen(true)} disabled={floors.length === 0}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Room
                </Button>
              </div>
              {floors.length === 0 && <p className="text-xs text-amber-600">Create floors first before adding rooms.</p>}
              {floors.map(floor => {
                const floorRooms = rooms.filter(r => r.floor_id === floor.id || (!r.floor_id && r.floor === floor.floor_order));
                if (floorRooms.length === 0) return (
                  <div key={floor.id} className="text-xs text-muted-foreground">
                    <span className="font-medium">{floor.name}</span> — No rooms
                  </div>
                );
                return (
                  <div key={floor.id}>
                    <span className="text-xs font-semibold">{floor.name}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {floorRooms.map(room => {
                        const bedCount = Object.values(floorData).flat().find((r: any) => r.roomId === room.id)?.beds?.length || 0;
                        const isRenaming = renameRoomId === room.id;
                        return (
                          <div key={room.id} className="flex items-center gap-0.5">
                            {isRenaming ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={renameRoomValue}
                                  onChange={e => setRenameRoomValue(e.target.value)}
                                  className="h-7 w-24 text-xs"
                                  autoFocus
                                  onKeyDown={e => { if (e.key === 'Enter') handleRenameRoom(room.id); if (e.key === 'Escape') setRenameRoomId(null); }}
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRenameRoom(room.id)}>✓</Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setRenameRoomId(null)}>✕</Button>
                              </div>
                            ) : (
                              <>
                                <button
                                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedRoomId === room.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border'}`}
                                  onClick={() => setSelectedRoomId(room.id)}
                                >
                                  {room.room_number} ({bedCount} beds)
                                </button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setRenameRoomId(room.id); setRenameRoomValue(room.room_number); }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteRoom(room.id)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
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
          setAddSharingOptionId(''); setAddCategory(''); setAddAmenities([]); setAddPrice('');
          setAddRoomIdInDialog(selectedRoomId);
          loadAddDialogSharingOptions(selectedRoomId);
          setAddBedDialogOpen(true);
        }}><Plus className="h-3.5 w-3.5 mr-1" />Add Beds</Button>
      </div>

      {viewMode === 'grid' ? (
        <div>
          {floorKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><Layers className="h-10 w-10 mx-auto mb-2 opacity-50" /><p>No rooms configured</p></div>
          ) : (
            <Tabs defaultValue={floorKeys[0]}>
              <TabsList className="mb-4">
                {floorKeys.map(floorKey => <TabsTrigger key={floorKey} value={floorKey}><Layers className="h-3.5 w-3.5 mr-1" />{floorKey}</TabsTrigger>)}
              </TabsList>
              {floorKeys.map(floorKey => (
                <TabsContent key={floorKey} value={floorKey}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {floorData[floorKey].map((room: any) => {
                      const totalBeds = room.beds.length;
                      const availBeds = room.beds.filter((b: any) => b.is_available && !b.is_blocked).length;
                      const pct = totalBeds > 0 ? ((totalBeds - availBeds) / totalBeds) * 100 : 0;
                      return (
                        <div key={room.roomId} className="border rounded-xl p-4 bg-card">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">Room {room.roomNumber}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{availBeds}/{totalBeds} beds</span>
                          </div>
                          <Progress value={pct} className="h-1.5 mb-3" />
                          {/* Bed Cards - room-style layout */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {room.beds.map((bed: any) => {
                              const isAvail = bed.is_available && !bed.is_blocked;
                              const isBlocked = bed.is_blocked;
                              let statusColor = 'border-emerald-400 bg-emerald-50/50';
                              let statusText = 'Available';
                              let statusDot = 'bg-emerald-500';
                              if (isBlocked) {
                                statusColor = 'border-destructive/30 bg-destructive/5';
                                statusText = 'Blocked';
                                statusDot = 'bg-destructive';
                              } else if (!isAvail) {
                                statusColor = 'border-blue-400 bg-blue-50/50';
                                statusText = 'Occupied';
                                statusDot = 'bg-blue-500';
                              }
                              const bedPrice = bed.price_override || bed.sharingPrice || 0;
                              return (
                                <button
                                  key={bed.id}
                                  className={`flex flex-col items-start rounded-lg border p-3 text-left cursor-pointer transition-all hover:shadow-md ${statusColor}`}
                                  onClick={() => handleGridBedClick(bed)}
                                >
                                  <div className="flex items-center justify-between w-full mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-bold text-sm">Bed #{bed.bed_number}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                                      <span className="text-[10px] text-muted-foreground">{statusText}</span>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    {bed.category && <Badge variant="outline" className="text-[9px] px-1.5 py-0">{bed.category}</Badge>}
                                    {bed.sharingType && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{bed.sharingType}</Badge>}
                                  </div>
                                  <span className="text-xs font-semibold text-primary">{formatCurrency(bedPrice)}/mo</span>
                                  {bed.occupantName && <span className="text-[10px] text-muted-foreground mt-0.5">👤 {bed.occupantName}</span>}
                                  {bed.amenities?.length > 0 && (
                                    <div className="flex flex-wrap gap-0.5 mt-1">
                                      {bed.amenities.slice(0, 3).map((a: string) => (
                                        <span key={a} className="text-[8px] bg-muted px-1 py-0.5 rounded">{a}</span>
                                      ))}
                                      {bed.amenities.length > 3 && <span className="text-[8px] text-muted-foreground">+{bed.amenities.length - 3}</span>}
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
          <div className="flex items-center justify-center gap-4 text-[11px] pt-3 border-t mt-4">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-emerald-400 bg-emerald-50" /><span>Available</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-blue-400 bg-blue-50" /><span>Occupied</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border border-destructive/30 bg-destructive/10" /><span>Blocked</span></div>
          </div>
        </div>
      ) : (
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
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Price (₹/month)</Label>
              <Input type="number" value={editPriceOverride} onChange={e => setEditPriceOverride(e.target.value)} placeholder="Set bed price" className="mt-1" />
            </div>
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox checked={editAmenities.includes(amenity)} onCheckedChange={() => toggleAmenity(amenity, editAmenities, setEditAmenities)} />
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

      {/* Add Beds Dialog - with price field */}
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
                    <SelectItem key={s.id} value={s.id}>{s.type}</SelectItem>
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
              <Label>Price (₹/month)</Label>
              <Input type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)} placeholder="Bed price per month" className="mt-1" />
            </div>
            <div>
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AMENITY_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox checked={addAmenities.includes(amenity)} onCheckedChange={() => toggleAmenity(amenity, addAmenities, setAddAmenities)} />
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

      {/* Add Room Dialog - no price field */}
      <Dialog open={addRoomDialogOpen} onOpenChange={setAddRoomDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Floor</Label>
              <Select value={newRoomFloorId} onValueChange={setNewRoomFloorId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select floor" /></SelectTrigger>
                <SelectContent>
                  {floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Room Number / Name</Label>
              <Input value={newRoomNumber} onChange={e => setNewRoomNumber(e.target.value)} placeholder="e.g. 101 or Flat A" className="mt-1" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input value={newRoomDescription} onChange={e => setNewRoomDescription(e.target.value)} placeholder="Room description" className="mt-1" />
            </div>
            <p className="text-xs text-muted-foreground">💡 Beds and pricing are configured after room creation.</p>
          </div>
          <DialogFooter>
            <Button onClick={handleAddRoom} disabled={saving || !newRoomNumber.trim() || !newRoomFloorId}>Add Room</Button>
          </DialogFooter>
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
