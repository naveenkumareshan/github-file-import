
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { settlementService } from '@/api/settlementService';
import { Loader2, Plus, Undo2 } from 'lucide-react';

interface Props {
  partnerId: string;
  open: boolean;
  onClose: () => void;
}

export const AdjustmentManager: React.FC<Props> = ({ partnerId, open, onClose }) => {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'penalty', amount: 0, description: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchAdjustments = async () => {
    setLoading(true);
    const { data } = await settlementService.getAdjustments(partnerId);
    setAdjustments(data || []);
    setLoading(false);
  };

  useEffect(() => { if (open) fetchAdjustments(); }, [open, partnerId]);

  const handleAdd = async () => {
    if (!form.description || form.amount === 0) {
      toast({ title: 'Error', description: 'Amount and description required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await settlementService.addAdjustment({ partner_id: partnerId, ...form });
    if (error) toast({ title: 'Error', description: 'Failed to add', variant: 'destructive' });
    else { toast({ title: 'Added' }); setShowAdd(false); setForm({ type: 'penalty', amount: 0, description: '' }); fetchAdjustments(); }
    setSaving(false);
  };

  const handleReverse = async (id: string) => {
    const { error } = await settlementService.reverseAdjustment(id);
    if (error) toast({ title: 'Error', variant: 'destructive' });
    else { toast({ title: 'Reversed' }); fetchAdjustments(); }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Adjustments
            <Button size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="h-3.5 w-3.5 mr-1" /> Add</Button>
          </DialogTitle>
        </DialogHeader>

        {showAdd && (
          <div className="border rounded-md p-3 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Damage</SelectItem>
                    <SelectItem value="penalty">Penalty</SelectItem>
                    <SelectItem value="cross_adjustment">Cross Adjustment</SelectItem>
                    <SelectItem value="previous_dues">Previous Dues</SelectItem>
                    <SelectItem value="manual_credit">Manual Credit</SelectItem>
                    <SelectItem value="refund_recovery">Refund Recovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Amount ₹ (+debit / -credit)</Label><Input type="number" className="h-8 text-xs" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea className="text-xs" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
            <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Save</Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead className="px-2 py-1">Date</TableHead>
                <TableHead className="px-2 py-1">Type</TableHead>
                <TableHead className="px-2 py-1 text-right">Amount</TableHead>
                <TableHead className="px-2 py-1">Description</TableHead>
                <TableHead className="px-2 py-1">Status</TableHead>
                <TableHead className="px-2 py-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4 text-xs text-muted-foreground">No adjustments</TableCell></TableRow>
              ) : adjustments.map(adj => (
                <TableRow key={adj.id} className="text-[10px]">
                  <TableCell className="px-2 py-1">{new Date(adj.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="px-2 py-1">{adj.type}</TableCell>
                  <TableCell className="px-2 py-1 text-right font-medium">₹{adj.amount?.toLocaleString()}</TableCell>
                  <TableCell className="px-2 py-1 max-w-[200px] truncate">{adj.description}</TableCell>
                  <TableCell className="px-2 py-1"><Badge variant="outline" className="text-[9px]">{adj.status}</Badge></TableCell>
                  <TableCell className="px-2 py-1">
                    {adj.status === 'pending' && <Button variant="ghost" size="sm" className="h-5 px-1 text-[9px]" onClick={() => handleReverse(adj.id)}><Undo2 className="h-3 w-3" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
