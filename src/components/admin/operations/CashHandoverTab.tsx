import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEffectiveOwnerId } from '@/utils/getEffectiveOwnerId';
import { formatCurrency } from '@/utils/currency';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Download, CheckCircle, Clock, History } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface Employee {
  id: string;
  name: string;
  employee_user_id: string | null;
}

interface Handover {
  id: string;
  from_user_id: string;
  from_name: string;
  to_user_id: string;
  to_name: string;
  amount: number;
  otp_code: string;
  status: string;
  notes: string;
  created_at: string;
  completed_at: string | null;
}

const CashHandoverTab: React.FC = () => {
  const { user } = useAuth();
  const [partnerId, setPartnerId] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initiate form
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');

  // Handover lists
  const [outgoing, setOutgoing] = useState<Handover[]>([]);
  const [incoming, setIncoming] = useState<Handover[]>([]);
  const [history, setHistory] = useState<Handover[]>([]);

  // OTP confirmation
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');

  const currentUserId = user?.id;

  useEffect(() => {
    (async () => {
      const { ownerId } = await getEffectiveOwnerId();
      setPartnerId(ownerId);
    })();
  }, []);

  const fetchData = useCallback(async () => {
    if (!partnerId || !currentUserId) return;
    setLoading(true);
    try {
      // Fetch employees (including partner themselves)
      const { data: emps } = await supabase
        .from('vendor_employees')
        .select('id, name, employee_user_id')
        .eq('partner_user_id', partnerId)
        .eq('status', 'active');

      // Build employee list - add partner + all employees except self
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', partnerId)
        .maybeSingle();

      const allPeople: Employee[] = [];
      if (partnerProfile && partnerProfile.id !== currentUserId) {
        allPeople.push({ id: partnerProfile.id, name: partnerProfile.name + ' (Owner)', employee_user_id: partnerProfile.id });
      }
      emps?.forEach(e => {
        if (e.employee_user_id && e.employee_user_id !== currentUserId) {
          allPeople.push(e);
        }
      });
      setEmployees(allPeople);

      // Fetch handovers
      const { data: handovers } = await supabase
        .from('cash_handovers')
        .select('*')
        .eq('partner_user_id', partnerId)
        .order('created_at', { ascending: false });

      const all = (handovers || []) as unknown as Handover[];
      setOutgoing(all.filter(h => h.from_user_id === currentUserId && h.status === 'pending'));
      setIncoming(all.filter(h => h.to_user_id === currentUserId && h.status === 'pending'));
      setHistory(all.filter(h => h.status === 'completed').slice(0, 50));
    } catch (err) {
      console.error('Error fetching handover data:', err);
    } finally {
      setLoading(false);
    }
  }, [partnerId, currentUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleInitiate = async () => {
    if (!receiverId || !amount || parseFloat(amount) <= 0) {
      toast({ title: 'Enter a valid receiver and amount', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Generate OTP
      const { data: otpData } = await supabase.rpc('generate_handover_otp');
      const otp = otpData as string;

      // Get names
      const selectedEmp = employees.find(e => (e.employee_user_id || e.id) === receiverId);
      const senderName = user?.name || '';
      const receiverName = selectedEmp?.name || '';

      const { error } = await supabase.from('cash_handovers').insert({
        partner_user_id: partnerId,
        from_user_id: currentUserId!,
        from_name: senderName,
        to_user_id: receiverId,
        to_name: receiverName,
        amount: parseFloat(amount),
        otp_code: otp,
        status: 'pending',
        notes: '',
      } as any);

      if (error) throw error;

      toast({ title: 'Handover initiated! Receiver will see the OTP.' });
      setAmount('');
      setReceiverId('');
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (handoverId: string) => {
    if (otpInput.length !== 4) {
      toast({ title: 'Enter the 4-digit OTP', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await supabase.rpc('verify_handover_otp', {
        p_handover_id: handoverId,
        p_otp: otpInput,
      });
      const result = data as any;
      if (result?.success) {
        toast({ title: 'Cash handover completed!' });
        setConfirmingId(null);
        setOtpInput('');
        fetchData();
      } else {
        toast({ title: 'Failed', description: result?.error || 'Invalid OTP', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (handoverId: string) => {
    await supabase.from('cash_handovers').update({ status: 'cancelled' } as any).eq('id', handoverId);
    toast({ title: 'Handover cancelled' });
    fetchData();
  };

  if (loading) {
    return <div className="space-y-3 p-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4 p-2">
      <Tabs defaultValue="initiate">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="initiate" className="text-xs gap-1"><Send className="h-3 w-3" />Send</TabsTrigger>
          <TabsTrigger value="incoming" className="text-xs gap-1 relative">
            <Download className="h-3 w-3" />Incoming
            {incoming.length > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">{incoming.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="text-xs gap-1">
            <Clock className="h-3 w-3" />Pending
            {outgoing.length > 0 && <Badge className="ml-1 h-4 px-1 text-[10px]">{outgoing.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs gap-1"><History className="h-3 w-3" />History</TabsTrigger>
        </TabsList>

        {/* INITIATE TAB */}
        <TabsContent value="initiate">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Initiate Cash Handover</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Handover To</Label>
                <Select value={receiverId} onValueChange={setReceiverId}>
                  <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                  <SelectContent>
                    {employees.map(e => (
                      <SelectItem key={e.employee_user_id || e.id} value={e.employee_user_id || e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount (₹)</Label>
                <Input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} min="1" />
              </div>
              <Button onClick={handleInitiate} disabled={submitting} className="w-full">
                {submitting ? 'Sending...' : 'Send Handover Request'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* INCOMING TAB - shows OTP to receiver */}
        <TabsContent value="incoming">
          {incoming.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No incoming handover requests</div>
          ) : (
            <div className="space-y-3">
              {incoming.map(h => (
                <Card key={h.id} className="border-primary/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground">Receiving from</p>
                        <p className="font-medium text-sm">{h.from_name}</p>
                      </div>
                      <Badge variant="secondary" className="text-base font-bold">{formatCurrency(h.amount)}</Badge>
                    </div>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">OTP — Read this to sender</p>
                      <p className="text-4xl font-mono font-bold tracking-[0.5em] text-primary">{h.otp_code}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Share this OTP with {h.from_name} to confirm the handover
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* OUTGOING / PENDING TAB - sender enters OTP here */}
        <TabsContent value="outgoing">
          {outgoing.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No pending outgoing handovers</div>
          ) : (
            <div className="space-y-3">
              {outgoing.map(h => (
                <Card key={h.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-muted-foreground">Handover to</p>
                        <p className="font-medium text-sm">{h.to_name}</p>
                      </div>
                      <Badge variant="outline" className="font-semibold">{formatCurrency(h.amount)}</Badge>
                    </div>

                    {confirmingId === h.id ? (
                      <div className="space-y-2">
                        <Label className="text-xs">Enter OTP from {h.to_name}</Label>
                        <div className="flex justify-center">
                          <InputOTP maxLength={4} value={otpInput} onChange={setOtpInput}>
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="flex-1" onClick={() => handleConfirm(h.id)} disabled={submitting}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setConfirmingId(null); setOtpInput(''); }}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" className="flex-1" onClick={() => { setConfirmingId(h.id); setOtpInput(''); }}>
                          Enter OTP
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleCancel(h.id)}>Cancel</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          {history.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No completed handovers yet</div>
          ) : (
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="text-xs font-medium">{h.from_name} → {h.to_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(h.completed_at || h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <Badge variant="secondary">{formatCurrency(h.amount)}</Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CashHandoverTab;
