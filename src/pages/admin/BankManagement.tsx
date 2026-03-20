import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Banknote, CreditCard, ChevronDown, ChevronRight, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEffectiveOwnerId } from '@/utils/getEffectiveOwnerId';
import { PaymentModesManager } from '@/components/vendor/PaymentModesManager';
import { formatCurrency } from '@/utils/currency';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { isCashMethod } from '@/utils/paymentMethodLabels';
import { useNavigate } from 'react-router-dom';

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
  is_active: boolean;
  linked_bank_id: string | null;
}

interface GroupedBalance {
  label: string;
  total: number;
  receipts: ReceiptRow[];
}

const BankManagement: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [partnerId, setPartnerId] = useState('');
  const [allReceipts, setAllReceipts] = useState<ReceiptRow[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (isAdmin) {
      setPartnerId('__admin__');
    } else {
      (async () => {
        const { ownerId } = await getEffectiveOwnerId();
        setPartnerId(ownerId);
      })();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!partnerId) return;
    fetchAll();
  }, [partnerId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Get property IDs for all modules
      // Admin sees ALL properties; partners see only their own
      const [cabinRes, hostelRes, messRes, laundryRes] = await Promise.all([
        isAdmin
          ? supabase.from('cabins').select('id')
          : supabase.from('cabins').select('id').eq('created_by', partnerId),
        isAdmin
          ? supabase.from('hostels').select('id')
          : supabase.from('hostels').select('id').eq('created_by', partnerId),
        isAdmin
          ? supabase.from('mess_partners').select('id')
          : supabase.from('mess_partners').select('id').eq('user_id', partnerId),
        isAdmin
          ? supabase.from('laundry_partners').select('id')
          : supabase.from('laundry_partners').select('id').eq('user_id', partnerId),
      ]);

      const cabinIds = cabinRes.data?.map(c => c.id) || [];
      const hostelIds = hostelRes.data?.map(h => h.id) || [];
      const messIds = messRes.data?.map(m => m.id) || [];
      const laundryIds = laundryRes.data?.map(l => l.id) || [];

      // Different select columns per table
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

      const [modesRes, handoverRes, ...receiptResults] = await Promise.all([
        supabase.from('partner_payment_modes').select('id, label, mode_type, is_active, linked_bank_id').eq('partner_user_id', partnerId),
        supabase.from('cash_handovers').select('*').eq('partner_user_id', partnerId).eq('status', 'completed'),
        ...receiptQueries,
      ]);

      setPaymentModes((modesRes.data || []) as PaymentMode[]);
      setHandovers(handoverRes.data || []);

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
      setAllReceipts(combined);
    } catch (err) {
      console.error('Error fetching bank data:', err);
    } finally {
      setLoading(false);
    }
  };

  const modeLookup = useMemo(() => {
    const map: Record<string, PaymentMode> = {};
    paymentModes.forEach(m => {
      map[`custom_${m.id}`] = m;
    });
    return map;
  }, [paymentModes]);

  const resolveType = (method: string): 'cash' | 'bank' | 'upi' | 'online' => {
    if (isCashMethod(method)) return 'cash';
    if (method === 'online') return 'online';
    if (method === 'bank_transfer') return 'bank';
    if (method === 'upi') return 'upi';
    const mode = modeLookup[method];
    if (mode) {
      if (mode.mode_type === 'cash') return 'cash';
      if (mode.mode_type === 'bank_transfer') return 'bank';
      // UPI with linked_bank_id → treat as bank
      if (mode.mode_type === 'upi' && mode.linked_bank_id) return 'bank';
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
      // UPI linked to a bank → use the bank's label
      if (mode.mode_type === 'upi' && mode.linked_bank_id) {
        const bankMode = modeLookup[`custom_${mode.linked_bank_id}`];
        return bankMode?.label || mode.label;
      }
      return mode.label;
    }
    return method;
  };

  // Cash balances: group by collected_by_name
  const cashBalances = useMemo(() => {
    const cashReceipts = allReceipts.filter(r => resolveType(r.payment_method) === 'cash');
    const byPerson: Record<string, { total: number; receipts: ReceiptRow[] }> = {};

    cashReceipts.forEach(r => {
      const person = r.collected_by_name || 'Unknown';
      if (!byPerson[person]) byPerson[person] = { total: 0, receipts: [] };
      byPerson[person].total += Number(r.amount) || 0;
      byPerson[person].receipts.push(r);
    });

    return Object.entries(byPerson)
      .map(([label, v]) => ({ label, total: v.total, receipts: v.receipts }))
      .sort((a, b) => b.total - a.total);
  }, [allReceipts, modeLookup]);

  // Bank balances: group by payment mode label
  const bankBalances = useMemo(() => {
    const bankReceipts = allReceipts.filter(r => resolveType(r.payment_method) === 'bank');
    const byMode: Record<string, { total: number; receipts: ReceiptRow[] }> = {};

    bankReceipts.forEach(r => {
      const label = resolveLabel(r.payment_method);
      if (!byMode[label]) byMode[label] = { total: 0, receipts: [] };
      byMode[label].total += Number(r.amount) || 0;
      byMode[label].receipts.push(r);
    });

    return Object.entries(byMode)
      .map(([label, v]) => ({ label, total: v.total, receipts: v.receipts }))
      .sort((a, b) => b.total - a.total);
  }, [allReceipts, modeLookup]);

  // UPI balances
  const upiBalances = useMemo(() => {
    const upiReceipts = allReceipts.filter(r => resolveType(r.payment_method) === 'upi');
    const byMode: Record<string, { total: number; receipts: ReceiptRow[] }> = {};

    upiReceipts.forEach(r => {
      const label = resolveLabel(r.payment_method);
      if (!byMode[label]) byMode[label] = { total: 0, receipts: [] };
      byMode[label].total += Number(r.amount) || 0;
      byMode[label].receipts.push(r);
    });

    return Object.entries(byMode)
      .map(([label, v]) => ({ label, total: v.total, receipts: v.receipts }))
      .sort((a, b) => b.total - a.total);
  }, [allReceipts, modeLookup]);

  // Online balances
  const onlineBalances = useMemo(() => {
    const onlineReceipts = allReceipts.filter(r => resolveType(r.payment_method) === 'online');
    const byMode: Record<string, { total: number; receipts: ReceiptRow[] }> = {};

    onlineReceipts.forEach(r => {
      const label = r.collected_by_name || 'Online';
      if (!byMode[label]) byMode[label] = { total: 0, receipts: [] };
      byMode[label].total += Number(r.amount) || 0;
      byMode[label].receipts.push(r);
    });

    return Object.entries(byMode)
      .map(([label, v]) => ({ label, total: v.total, receipts: v.receipts }))
      .sort((a, b) => b.total - a.total);
  }, [allReceipts, modeLookup]);

  const totalCash = useMemo(() => cashBalances.reduce((s, b) => s + b.total, 0), [cashBalances]);
  const totalBank = useMemo(() => bankBalances.reduce((s, b) => s + b.total, 0), [bankBalances]);
  const totalUpi = useMemo(() => upiBalances.reduce((s, b) => s + b.total, 0), [upiBalances]);
  const totalOnline = useMemo(() => onlineBalances.reduce((s, b) => s + b.total, 0), [onlineBalances]);

  const toggleRow = (key: string) => {
    setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Determine route prefix
  const routePrefix = window.location.pathname.startsWith('/partner') ? '/partner' : '/admin';

  const handleRowClick = (type: string, label: string) => {
    navigate(`${routePrefix}/banks/${type}/${encodeURIComponent(label)}`);
  };

  const renderBalanceGroup = (balances: GroupedBalance[], type: string, icon: React.ReactNode) => {
    if (balances.length === 0) {
      return <div className="text-center text-xs text-muted-foreground py-6">No {type} transactions found.</div>;
    }

    return (
      <div className="space-y-2">
        {balances.map(b => {
          const key = `${type}-${b.label}`;
          const isOpen = expandedRows[key] || false;
          return (
            <Collapsible key={key} open={isOpen} onOpenChange={() => toggleRow(key)}>
              <div className="flex items-center border rounded-lg hover:bg-muted/50 transition-colors">
                <div
                  className="flex-1 flex items-center justify-between p-3 cursor-pointer"
                  onClick={() => handleRowClick(type, b.label)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                      {icon}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{b.label}</p>
                      <p className="text-xs text-muted-foreground">{b.receipts.length} transactions</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm font-semibold">{formatCurrency(b.total)}</Badge>
                </div>
                <CollapsibleTrigger className="p-3 hover:bg-muted/30 rounded-r-lg">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="border border-t-0 rounded-b-lg overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium">Date</th>
                          <th className="text-left p-2 font-medium">Serial</th>
                          <th className="text-left p-2 font-medium">Source</th>
                          <th className="text-right p-2 font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b.receipts
                          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .slice(0, 10)
                          .map((r, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="p-2">
                                {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                              </td>
                              <td className="p-2 text-muted-foreground">{r.serial_number || '-'}</td>
                              <td className="p-2 text-muted-foreground">{r.source}</td>
                              <td className="p-2 text-right font-medium">{formatCurrency(Number(r.amount))}</td>
                            </tr>
                          ))}
                        {b.receipts.length > 10 && (
                          <tr className="border-t">
                            <td colSpan={4} className="p-2 text-center text-muted-foreground cursor-pointer hover:text-foreground"
                              onClick={() => handleRowClick(type, b.label)}>
                              View all {b.receipts.length} transactions →
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6" /> Bank Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View cash, bank, UPI & online balances with full transaction lists.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cash</p>
              {loading ? <Skeleton className="h-6 w-24 mt-1" /> : <p className="text-lg font-bold text-green-600">{formatCurrency(totalCash)}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bank</p>
              {loading ? <Skeleton className="h-6 w-24 mt-1" /> : <p className="text-lg font-bold text-blue-600">{formatCurrency(totalBank)}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">UPI</p>
              {loading ? <Skeleton className="h-6 w-24 mt-1" /> : <p className="text-lg font-bold text-purple-600">{formatCurrency(totalUpi)}</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Online</p>
              {loading ? <Skeleton className="h-6 w-24 mt-1" /> : <p className="text-lg font-bold text-orange-600">{formatCurrency(totalOnline)}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Balance Sections */}
      <Tabs defaultValue="cash">
        <TabsList>
          <TabsTrigger value="cash" className="gap-1.5"><Banknote className="h-3.5 w-3.5" />Cash</TabsTrigger>
          <TabsTrigger value="bank" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Bank</TabsTrigger>
          <TabsTrigger value="upi" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" />UPI</TabsTrigger>
          <TabsTrigger value="online" className="gap-1.5"><Globe className="h-3.5 w-3.5" />Online</TabsTrigger>
        </TabsList>

        <TabsContent value="cash">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Cash Balances by Person
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : renderBalanceGroup(cashBalances, 'cash', <Banknote className="h-4 w-4 text-green-600" />)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Bank-wise Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : renderBalanceGroup(bankBalances, 'bank', <Building2 className="h-4 w-4 text-blue-600" />)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upi">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> UPI-wise Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : renderBalanceGroup(upiBalances, 'upi', <CreditCard className="h-4 w-4 text-purple-600" />)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="online">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" /> Online Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : renderBalanceGroup(onlineBalances, 'online', <Globe className="h-4 w-4 text-orange-600" />)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Modes Manager */}
      <PaymentModesManager />
    </div>
  );
};

export default BankManagement;
