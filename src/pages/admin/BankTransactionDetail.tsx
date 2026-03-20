import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Banknote, Building2, CreditCard, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEffectiveOwnerId } from '@/utils/getEffectiveOwnerId';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { isCashMethod } from '@/utils/paymentMethodLabels';

interface ReceiptRow {
  amount: number;
  payment_method: string;
  collected_by_name: string | null;
  created_at: string;
  serial_number: string | null;
  user_id: string;
  source: string;
}

interface PaymentMode {
  id: string;
  label: string;
  mode_type: string;
  linked_bank_id: string | null;
}

const BankTransactionDetail: React.FC = () => {
  const { type, label } = useParams<{ type: string; label: string }>();
  const navigate = useNavigate();
  const decodedLabel = decodeURIComponent(label || '');
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [type, label]);

  const modeLookup = useMemo(() => {
    const map: Record<string, PaymentMode> = {};
    paymentModes.forEach(m => {
      map[`custom_${m.id}`] = m;
    });
    return map;
  }, [paymentModes]);

  const resolveType = (method: string): string => {
    if (isCashMethod(method)) return 'cash';
    if (method === 'online') return 'online';
    if (method === 'bank_transfer') return 'bank';
    if (method === 'upi') return 'upi';
    const mode = modeLookup[method];
    if (mode) {
      if (mode.mode_type === 'upi' && mode.linked_bank_id) return 'bank';
      if (mode.mode_type === 'bank_transfer') return 'bank';
      if (mode.mode_type === 'cash') return 'cash';
      if (mode.mode_type === 'upi') return 'upi';
    }
    return 'cash';
  };

  const resolveLabel = (method: string): string => {
    if (isCashMethod(method)) return 'Cash';
    if (method === 'online') return 'Online';
    if (method === 'bank_transfer') return 'Bank Transfer';
    if (method === 'upi') return 'UPI';
    const mode = modeLookup[method];
    if (mode) {
      if (mode.mode_type === 'upi' && mode.linked_bank_id) {
        const bankMode = modeLookup[`custom_${mode.linked_bank_id}`];
        return bankMode?.label || mode.label;
      }
      return mode.label;
    }
    return method;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { ownerId } = await getEffectiveOwnerId();

      const [cabinRes, hostelRes, messRes, laundryRes, modesRes] = await Promise.all([
        supabase.from('cabins').select('id').eq('created_by', ownerId),
        supabase.from('hostels').select('id').eq('created_by', ownerId),
        supabase.from('mess_partners').select('id').eq('user_id', ownerId),
        supabase.from('laundry_partners').select('id').eq('user_id', ownerId),
        supabase.from('partner_payment_modes').select('id, label, mode_type, linked_bank_id').eq('partner_user_id', ownerId),
      ]);

      setPaymentModes((modesRes.data || []) as PaymentMode[]);

      const cabinIds = cabinRes.data?.map(c => c.id) || [];
      const hostelIds = hostelRes.data?.map(h => h.id) || [];
      const messIds = messRes.data?.map(m => m.id) || [];
      const laundryIds = laundryRes.data?.map(l => l.id) || [];

      const receiptQueries = [
        cabinIds.length > 0
          ? supabase.from('receipts' as any).select('amount, payment_method, collected_by_name, created_at, serial_number, user_id').in('cabin_id', cabinIds)
          : Promise.resolve({ data: [] }),
        hostelIds.length > 0
          ? supabase.from('hostel_receipts' as any).select('amount, payment_method, collected_by_name, created_at, serial_number, user_id').in('hostel_id', hostelIds)
          : Promise.resolve({ data: [] }),
        messIds.length > 0
          ? supabase.from('mess_receipts' as any).select('amount, payment_method, created_at, serial_number, user_id').in('mess_id', messIds)
          : Promise.resolve({ data: [] }),
        laundryIds.length > 0
          ? supabase.from('laundry_receipts' as any).select('amount, payment_method, created_at, serial_number, user_id').in('partner_id', laundryIds)
          : Promise.resolve({ data: [] }),
      ];

      const receiptResults = await Promise.all(receiptQueries);
      const sourceLabels = ['Reading Room', 'Hostel', 'Mess', 'Laundry'];
      const combined: ReceiptRow[] = [];
      receiptResults.forEach((res, idx) => {
        const data = (res as any).data;
        if (data) {
          data.forEach((r: any) => {
            combined.push({
              amount: r.amount,
              payment_method: r.payment_method,
              collected_by_name: r.collected_by_name || null,
              created_at: r.created_at,
              serial_number: r.serial_number,
              user_id: r.user_id,
              source: sourceLabels[idx],
            });
          });
        }
      });

      setReceipts(combined);
    } catch (err) {
      console.error('Error fetching transaction detail:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter receipts matching this type/label
  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      const rType = resolveType(r.payment_method);
      if (rType !== type) return false;

      if (type === 'cash') {
        return (r.collected_by_name || 'Unknown') === decodedLabel;
      }
      if (type === 'online') {
        return (r.collected_by_name || 'Online') === decodedLabel;
      }
      return resolveLabel(r.payment_method) === decodedLabel;
    });
  }, [receipts, type, decodedLabel, modeLookup]);

  const totalAmount = useMemo(() => filteredReceipts.reduce((s, r) => s + (Number(r.amount) || 0), 0), [filteredReceipts]);

  const sortedReceipts = useMemo(() =>
    [...filteredReceipts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [filteredReceipts]
  );

  const typeIcon = type === 'cash' ? <Banknote className="h-5 w-5" />
    : type === 'bank' ? <Building2 className="h-5 w-5" />
    : type === 'upi' ? <CreditCard className="h-5 w-5" />
    : <Globe className="h-5 w-5" />;

  const typeColor = type === 'cash' ? 'text-green-600'
    : type === 'bank' ? 'text-blue-600'
    : type === 'upi' ? 'text-purple-600'
    : 'text-orange-600';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className={typeColor}>{typeIcon}</span>
            {decodedLabel}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{type} Transactions</p>
        </div>
      </div>

      {/* Closing Balance Card */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Closing Balance</p>
            <p className={`text-2xl font-bold ${typeColor}`}>{formatCurrency(totalAmount)}</p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {filteredReceipts.length} transactions
          </Badge>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : sortedReceipts.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="text-left p-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Serial No</th>
                    <th className="text-left p-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Source</th>
                    <th className="text-right p-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReceipts.map((r, idx) => (
                    <tr key={idx} className={`border-t ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                      <td className="p-3">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">{r.serial_number || '-'}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">{r.source}</Badge>
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(Number(r.amount))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 border-t-2">
                  <tr>
                    <td colSpan={3} className="p-3 font-semibold text-sm">Closing Balance</td>
                    <td className={`p-3 text-right font-bold text-base ${typeColor}`}>{formatCurrency(totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BankTransactionDetail;
