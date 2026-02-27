
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Search, RefreshCw, Receipt } from 'lucide-react';

export default function HostelReceipts() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => { fetchReceipts(); }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hostel_receipts')
        .select('*, hostels(name), hostel_bookings:booking_id(serial_number), profiles:user_id(name, email, phone)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReceipts(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch receipts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = receipts.filter(r => {
    if (typeFilter !== 'all' && r.receipt_type !== typeFilter) return false;
    const s = searchTerm.toLowerCase();
    if (!s) return true;
    return (
      r.serial_number?.toLowerCase().includes(s) ||
      r.profiles?.name?.toLowerCase().includes(s) ||
      r.profiles?.email?.toLowerCase().includes(s) ||
      r.hostel_bookings?.serial_number?.toLowerCase().includes(s)
    );
  });

  const typeLabel = (t: string) => {
    switch (t) {
      case 'booking_payment': return 'Booking Payment';
      case 'due_collection': return 'Due Collection';
      case 'deposit_refund': return 'Deposit Refund';
      default: return t;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Hostel Receipts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">All hostel payment receipts</p>
        </div>
        <Button onClick={fetchReceipts} variant="outline" size="sm" className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 mb-4 p-3 bg-muted/30 rounded-lg border border-border/40">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search by student or receipt #..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-sm w-full md:w-48"><SelectValue placeholder="Filter by type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="booking_payment">Booking Payment</SelectItem>
                <SelectItem value="due_collection">Due Collection</SelectItem>
                <SelectItem value="deposit_refund">Deposit Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Receipt className="h-8 w-8 opacity-20" />
              <p className="text-sm font-medium">No receipts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Receipt #</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Booking #</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Student</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Hostel</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Amount</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Method</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider py-3">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow key={r.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <TableCell className="text-sm font-medium">{r.serial_number || '-'}</TableCell>
                      <TableCell className="text-sm">{r.hostel_bookings?.serial_number || '-'}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{r.profiles?.name || '-'}</p>
                        {r.profiles?.phone && <p className="text-xs text-muted-foreground">{r.profiles.phone}</p>}
                      </TableCell>
                      <TableCell className="text-sm">{r.hostels?.name || '-'}</TableCell>
                      <TableCell className="text-sm font-medium">₹{r.amount}</TableCell>
                      <TableCell className="text-sm capitalize">{r.payment_method}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground border border-border">
                          {typeLabel(r.receipt_type)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(r.created_at), 'dd MMM yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
