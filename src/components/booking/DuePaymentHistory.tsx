import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Receipt, IndianRupee } from 'lucide-react';
import { vendorSeatsService } from '@/api/vendorSeatsService';
import { cn } from '@/lib/utils';

interface DuePayment {
  id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  collected_by_name: string;
  notes: string;
  created_at: string;
}

interface DuePaymentHistoryProps {
  dueId: string;
  /** Optional: show summary header with due info */
  dueInfo?: {
    totalFee: number;
    advancePaid: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
  };
  /** Compact mode for inline display */
  compact?: boolean;
  /** Default open state */
  defaultOpen?: boolean;
}

const methodLabel = (m: string) => {
  switch (m) {
    case 'cash': return 'Cash';
    case 'upi': return 'UPI';
    case 'bank_transfer': return 'Bank Transfer';
    case 'online': return 'Online';
    default: return m;
  }
};

export const DuePaymentHistory: React.FC<DuePaymentHistoryProps> = ({
  dueId,
  dueInfo,
  compact = false,
  defaultOpen = false,
}) => {
  const [payments, setPayments] = useState<DuePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!dueId) return;
    const fetch = async () => {
      setLoading(true);
      const res = await vendorSeatsService.getDuePayments(dueId);
      if (res.success && res.data) setPayments(res.data);
      setLoading(false);
    };
    fetch();
  }, [dueId]);

  if (loading) {
    return <div className="flex justify-center py-2"><div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (payments.length === 0 && !dueInfo) return null;

  const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);

  const content = (
    <div className="space-y-1.5">
      {dueInfo && (
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Fee</span><span>₹{dueInfo.totalFee.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Advance Paid</span><span>₹{dueInfo.advancePaid.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Collected</span><span className="text-emerald-600">₹{(dueInfo.paidAmount).toLocaleString()}</span></div>
          <div className="flex justify-between font-medium text-red-600"><span>Remaining</span><span>₹{Math.max(0, dueInfo.dueAmount - dueInfo.paidAmount).toLocaleString()}</span></div>
          <Separator className="my-1" />
        </div>
      )}
      {payments.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-2">No payment receipts yet</p>
      ) : (
        payments.map((p) => (
          <div key={p.id} className="border rounded p-2 text-[11px] space-y-0.5 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="font-medium">₹{Number(p.amount).toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground">{format(new Date(p.created_at), 'dd MMM yyyy, HH:mm')}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{methodLabel(p.payment_method)}</span>
              {p.collected_by_name && <span>by {p.collected_by_name}</span>}
            </div>
            {p.transaction_id && <div className="text-[10px] text-muted-foreground">Txn: {p.transaction_id}</div>}
            {p.notes && <div className="text-[10px] text-muted-foreground italic">{p.notes}</div>}
          </div>
        ))
      )}
    </div>
  );

  if (compact) {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full h-6 text-[10px] gap-1 justify-between px-2">
            <span className="flex items-center gap-1"><Receipt className="h-3 w-3" /> Payment History ({payments.length})</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-1">
          {content}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-[13px] font-semibold flex items-center gap-1.5">
        <Receipt className="h-3.5 w-3.5" />
        Payment Receipts ({payments.length})
      </h3>
      {content}
    </div>
  );
};
