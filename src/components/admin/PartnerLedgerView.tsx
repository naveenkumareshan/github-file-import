
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { settlementService } from '@/api/settlementService';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface Props {
  partnerId: string;
  open: boolean;
  onClose: () => void;
}

export const PartnerLedgerView: React.FC<Props> = ({ partnerId, open, onClose }) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: 'all', startDate: '', endDate: '' });

  const fetchLedger = async () => {
    setLoading(true);
    const { data } = await settlementService.getPartnerLedger(partnerId, {
      category: filters.category,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    });
    setEntries(data || []);
    setLoading(false);
  };

  useEffect(() => { if (open) fetchLedger(); }, [open, partnerId, filters]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Partner Ledger</DialogTitle></DialogHeader>

        <div className="flex flex-wrap gap-2 items-end mb-3">
          <div>
            <Label className="text-[10px]">Category</Label>
            <Select value={filters.category} onValueChange={v => setFilters(f => ({ ...f, category: v }))}>
              <SelectTrigger className="h-7 text-xs w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="booking_collection">Booking</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="gateway_fee">Gateway Fee</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="tds">TDS</SelectItem>
                <SelectItem value="security_hold">Security Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-[10px]">From</Label><Input type="date" className="h-7 text-xs w-[120px]" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} /></div>
          <div><Label className="text-[10px]">To</Label><Input type="date" className="h-7 text-xs w-[120px]" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} /></div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead className="px-2 py-1">Date</TableHead>
                <TableHead className="px-2 py-1">Type</TableHead>
                <TableHead className="px-2 py-1">Category</TableHead>
                <TableHead className="px-2 py-1 text-right">Amount</TableHead>
                <TableHead className="px-2 py-1 text-right">Balance</TableHead>
                <TableHead className="px-2 py-1">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4 text-xs text-muted-foreground">No ledger entries</TableCell></TableRow>
              ) : entries.map(e => (
                <TableRow key={e.id} className="text-[10px]">
                  <TableCell className="px-2 py-1">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="px-2 py-1">
                    <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${e.entry_type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {e.entry_type.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-1">{e.category}</TableCell>
                  <TableCell className="px-2 py-1 text-right font-medium">{e.entry_type === 'credit' ? '+' : '-'}{formatCurrency(Number(e.amount) || 0)}</TableCell>
                  <TableCell className="px-2 py-1 text-right">{formatCurrency(Number(e.running_balance) || 0)}</TableCell>
                  <TableCell className="px-2 py-1 max-w-[200px] truncate">{e.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
