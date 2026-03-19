import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; phone: string; category: string; source: string }) => Promise<void>;
}

const CATEGORIES = [
  { value: 'hostel', label: 'Hostel' },
  { value: 'pg', label: 'PG' },
  { value: 'reading_room', label: 'Reading Room' },
  { value: 'laundry', label: 'Laundry' },
  { value: 'mess', label: 'Food / Mess' },
];

const SOURCES = [
  { value: 'walk_in', label: 'Walk-in' },
  { value: 'app', label: 'App' },
  { value: 'call', label: 'Call' },
  { value: 'referral', label: 'Referral' },
];

const AddLeadDialog: React.FC<AddLeadDialogProps> = ({ open, onOpenChange, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('reading_room');
  const [source, setSource] = useState('walk_in');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), phone: phone.trim(), category, source });
      setName('');
      setPhone('');
      setCategory('reading_room');
      setSource('walk_in');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="lead-name">Name</Label>
            <Input id="lead-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
          </div>
          <div>
            <Label htmlFor="lead-phone">Phone *</Label>
            <Input id="lead-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone number" required />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={saving || !phone.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Lead
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLeadDialog;
