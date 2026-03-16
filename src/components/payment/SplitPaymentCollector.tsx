import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { PaymentMethodSelector, requiresTransactionId } from '@/components/vendor/PaymentMethodSelector';
import { PaymentProofUpload } from '@/components/payment/PaymentProofUpload';

export interface PaymentSplit {
  id: string;
  method: string;
  amount: string;
  txnId: string;
  proofUrl: string;
}

interface SplitPaymentCollectorProps {
  totalAmount: number;
  partnerId?: string;
  splits: PaymentSplit[];
  onSplitsChange: (splits: PaymentSplit[]) => void;
  compact?: boolean;
}

let splitCounter = 0;
const newSplitId = () => `split_${++splitCounter}_${Date.now()}`;

export const createDefaultSplit = (amount: number): PaymentSplit => ({
  id: newSplitId(),
  method: 'cash',
  amount: String(amount),
  txnId: '',
  proofUrl: '',
});

export const validateSplits = (splits: PaymentSplit[], totalAmount: number): string | null => {
  if (splits.length === 0) return 'Add at least one payment method';
  
  for (let i = 0; i < splits.length; i++) {
    const amt = parseFloat(splits[i].amount || '0');
    if (amt <= 0) return `Split #${i + 1}: Enter a valid amount`;
    if (requiresTransactionId(splits[i].method) && !splits[i].txnId.trim()) {
      return `Split #${i + 1}: Transaction ID required for non-cash payment`;
    }
  }

  const totalSplit = splits.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  if (Math.abs(totalSplit - totalAmount) > 0.01) {
    return `Split total (₹${totalSplit.toLocaleString()}) doesn't match collection amount (₹${totalAmount.toLocaleString()})`;
  }

  return null;
};

export const SplitPaymentCollector: React.FC<SplitPaymentCollectorProps> = ({
  totalAmount,
  partnerId,
  splits,
  onSplitsChange,
  compact = false,
}) => {
  const updateSplit = (id: string, field: keyof PaymentSplit, value: string) => {
    onSplitsChange(splits.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeSplit = (id: string) => {
    if (splits.length <= 1) return;
    onSplitsChange(splits.filter(s => s.id !== id));
  };

  const addSplit = () => {
    const usedTotal = splits.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
    const remaining = Math.max(0, totalAmount - usedTotal);
    onSplitsChange([...splits, createDefaultSplit(remaining)]);
  };

  const totalSplit = splits.reduce((sum, s) => sum + parseFloat(s.amount || '0'), 0);
  const isMatched = Math.abs(totalSplit - totalAmount) < 0.01;

  return (
    <div className="space-y-3">
      {splits.map((split, idx) => (
        <div key={split.id} className="border rounded p-2.5 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Payment {splits.length > 1 ? `#${idx + 1}` : 'Method'}
            </span>
            {splits.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => removeSplit(split.id)}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>

          {splits.length > 1 && (
            <div>
              <Label className="text-[10px]">Amount (₹)</Label>
              <Input
                type="number"
                className="h-7 text-xs"
                value={split.amount}
                onChange={e => updateSplit(split.id, 'amount', e.target.value)}
              />
            </div>
          )}

          <div>
            <Label className="text-[10px]">Method</Label>
            <PaymentMethodSelector
              value={split.method}
              onValueChange={v => updateSplit(split.id, 'method', v)}
              partnerId={partnerId}
              idPrefix={`sp_${idx}`}
              columns={2}
              compact={compact}
            />
          </div>

          {requiresTransactionId(split.method) && (
            <div>
              <Label className="text-[10px]">Transaction ID *</Label>
              <Input
                className="h-7 text-xs"
                value={split.txnId}
                onChange={e => updateSplit(split.id, 'txnId', e.target.value)}
              />
            </div>
          )}

          {split.method !== 'cash' && (
            <PaymentProofUpload
              value={split.proofUrl}
              onChange={v => updateSplit(split.id, 'proofUrl', v)}
            />
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full h-7 text-[10px] gap-1"
        onClick={addSplit}
      >
        <Plus className="h-3 w-3" /> Add Another Payment Method
      </Button>

      {splits.length > 1 && (
        <div className={`flex items-center gap-1.5 text-[11px] px-1 ${isMatched ? 'text-emerald-600' : 'text-destructive'}`}>
          {isMatched ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          <span>
            Split Total: ₹{totalSplit.toLocaleString()}
            {!isMatched && ` (need ₹${totalAmount.toLocaleString()})`}
          </span>
        </div>
      )}
    </div>
  );
};
