import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cabinSlotService, CabinSlot } from '@/api/cabinSlotService';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Clock, Edit2, Check, X } from 'lucide-react';
import { formatTime } from '@/utils/timingUtils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SlotManagementProps {
  cabinId: string;
}

export function SlotManagement({ cabinId }: SlotManagementProps) {
  const [slots, setSlots] = useState<CabinSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('06:00');
  const [newEnd, setNewEnd] = useState('12:00');
  const [newPrice, setNewPrice] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editPrice, setEditPrice] = useState('');

  const fetchSlots = async () => {
    setLoading(true);
    const res = await cabinSlotService.getAllSlotsByCabin(cabinId);
    if (res.success) setSlots(res.data);
    setLoading(false);
  };

  useEffect(() => {
    if (cabinId) fetchSlots();
  }, [cabinId]);

  const handleAddSlot = async () => {
    if (!newName.trim() || !newPrice) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    const res = await cabinSlotService.createSlot({
      cabin_id: cabinId,
      name: newName.trim(),
      start_time: newStart,
      end_time: newEnd,
      price: parseFloat(newPrice),
    });
    if (res.success) {
      toast({ title: 'Slot Created', description: `${newName} added` });
      setNewName(''); setNewStart('06:00'); setNewEnd('12:00'); setNewPrice('');
      setShowAddForm(false);
      fetchSlots();
    } else {
      toast({ title: 'Error', description: 'Failed to create slot', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await cabinSlotService.deleteSlot(id);
    if (res.success) {
      toast({ title: 'Slot Deleted' });
      fetchSlots();
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const res = await cabinSlotService.toggleSlotActive(id, isActive);
    if (res.success) fetchSlots();
  };

  const startEdit = (slot: CabinSlot) => {
    setEditingId(slot.id);
    setEditName(slot.name);
    setEditStart(slot.start_time);
    setEditEnd(slot.end_time);
    setEditPrice(String(slot.price));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const res = await cabinSlotService.updateSlot(editingId, {
      name: editName.trim(),
      start_time: editStart,
      end_time: editEnd,
      price: parseFloat(editPrice),
    });
    if (res.success) {
      toast({ title: 'Slot Updated' });
      setEditingId(null);
      fetchSlots();
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Slots ({slots.length})
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Slot
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Slot Name</Label>
                <Input placeholder="e.g. Morning Batch" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Price (₹/mo)</Label>
                <Input type="number" placeholder="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddSlot}>Add Slot</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slots List */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading slots...</p>
      ) : slots.length === 0 ? (
        <p className="text-xs text-muted-foreground">No slots configured yet. Add your first slot above.</p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <div key={slot.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              {editingId === slot.id ? (
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-7 text-xs" />
                    <Input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="h-7 text-xs" />
                    <Input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="h-7 text-xs" />
                    <Input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
                    <Button size="sm" className="h-7 px-2" onClick={handleSaveEdit}><Check className="h-3 w-3" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{slot.name}</span>
                      {!slot.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)} • ₹{slot.price}/mo
                    </p>
                  </div>
                  <Switch checked={slot.is_active} onCheckedChange={(checked) => handleToggle(slot.id, checked)} />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEdit(slot)}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Slot</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{slot.name}"? This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(slot.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
