import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, addMonths, subDays, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getEffectiveOwnerId } from '@/utils/getEffectiveOwnerId';
import { vendorSeatsService } from '@/api/vendorSeatsService';
import { getMessPackages, createMessReceipt } from '@/api/messService';
import { formatCurrency } from '@/utils/currency';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PaymentProofUpload } from '@/components/payment/PaymentProofUpload';
import { Search, UserPlus, Loader2, Check, CalendarIcon } from 'lucide-react';

export default function ManualMessBooking() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const routePrefix = isAdmin ? '/admin' : '/partner';
  const studentSearchRef = useRef<HTMLDivElement>(null);

  // Student
  const [studentQuery, setStudentQuery] = useState('');
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [studentSearching, setStudentSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creatingStudent, setCreatingStudent] = useState(false);

  // Mess
  const [messes, setMesses] = useState<any[]>([]);
  const [selectedMess, setSelectedMess] = useState<any>(null);

  // Package
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // Dates
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  const [pricePaid, setPricePaid] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [collectedByName, setCollectedByName] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Student search
  useEffect(() => {
    if (studentQuery.length < 2) { setStudentResults([]); return; }
    const timer = setTimeout(async () => {
      setStudentSearching(true);
      const res = await vendorSeatsService.searchStudents(studentQuery);
      if (res.success && res.data) { setStudentResults(res.data); setShowResults(true); }
      setStudentSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentQuery]);

  // Fetch messes
  useEffect(() => {
    (async () => {
      const { ownerId } = await getEffectiveOwnerId();
      let q = supabase.from('mess_partners' as any).select('id, name, food_type').eq('is_active', true);
      if (!isAdmin) q = q.eq('user_id', ownerId);
      const { data } = await q.order('name');
      setMesses(data || []);
    })();
  }, []);

  const handleStudentSelect = (s: any) => {
    setSelectedUserId(s.id);
    setSelectedStudentName(`${s.name} (${s.email})`);
    setStudentQuery(s.name);
    setShowResults(false);
  };

  const handleCreateStudent = async () => {
    if (!newName || !newEmail) { toast({ title: 'Name & email required', variant: 'destructive' }); return; }
    setCreatingStudent(true);
    const res = await vendorSeatsService.createStudent(newName, newEmail, newPhone);
    if (res.success && res.userId) {
      setSelectedUserId(res.userId);
      setSelectedStudentName(`${newName} (${newEmail})`);
      setShowNewStudent(false);
      toast({ title: res.existing ? 'Existing student selected' : 'Student created' });
    } else { toast({ title: 'Error', description: res.error, variant: 'destructive' }); }
    setCreatingStudent(false);
  };

  const handleMessSelect = async (mess: any) => {
    setSelectedMess(mess);
    setSelectedPackage(null);
    const pkgs = await getMessPackages(mess.id);
    setPackages(pkgs);
  };

  const handlePackageSelect = (pkg: any) => {
    setSelectedPackage(pkg);
    setPricePaid(pkg.price);
    setAdvanceAmount(pkg.price);
    const start = new Date(startDate);
    const count = pkg.duration_count || 1;
    let end: Date;
    if (pkg.duration_type === 'daily') end = addDays(start, count - 1);
    else if (pkg.duration_type === 'weekly') end = addDays(start, count * 7 - 1);
    else end = subDays(addMonths(start, count), 1);
    setEndDate(format(end, 'yyyy-MM-dd'));
  };

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (selectedPackage) {
      const start = new Date(val);
      const count = selectedPackage.duration_count || 1;
      let end: Date;
      if (selectedPackage.duration_type === 'daily') end = addDays(start, count - 1);
      else if (selectedPackage.duration_type === 'weekly') end = addDays(start, count * 7 - 1);
      else end = subDays(addMonths(start, count), 1);
      setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  const totalAfterDiscount = Math.max(0, pricePaid - discountAmount);
  const dueAmount = Math.max(0, totalAfterDiscount - advanceAmount);
  const isPartialPayment = dueAmount > 0;

  const handleSubmit = async () => {
    if (!selectedUserId || !selectedMess || !selectedPackage) return;
    setSubmitting(true);
    try {
      const { data: sub, error: subErr } = await supabase.from('mess_subscriptions' as any).insert({
        user_id: selectedUserId,
        mess_id: selectedMess.id,
        package_id: selectedPackage.id,
        start_date: startDate,
        end_date: endDate,
        price_paid: totalAfterDiscount,
        payment_method: paymentMethod,
        payment_status: isPartialPayment ? 'advance_paid' : 'completed',
        status: 'active',
        transaction_id: transactionId,
        advance_amount: advanceAmount,
        discount_amount: discountAmount,
        notes,
        created_by: user?.id,
        collected_by_name: collectedByName || user?.name || '',
        payment_proof_url: paymentProofUrl || null,
      }).select().single();
      if (subErr) throw subErr;

      await createMessReceipt({
        subscription_id: (sub as any).id,
        user_id: selectedUserId,
        mess_id: selectedMess.id,
        amount: advanceAmount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        collected_by: user?.id,
        collected_by_name: collectedByName || user?.name || '',
        payment_proof_url: paymentProofUrl || null,
        notes,
      });

      if (isPartialPayment) {
        await supabase.from('mess_dues' as any).insert({
          subscription_id: (sub as any).id,
          user_id: selectedUserId,
          mess_id: selectedMess.id,
          total_fee: totalAfterDiscount,
          advance_paid: advanceAmount,
          paid_amount: 0,
          due_amount: dueAmount,
          status: 'pending',
          due_date: endDate,
        });
      }

      toast({ title: 'Mess subscription created successfully!' });
      navigate(`${routePrefix}/mess-bookings`);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'card', label: 'Card' },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-24">
      {/* Page Header */}
      <div className="px-3 pt-2 pb-1">
        <h1 className="text-lg font-bold text-foreground leading-tight">Manual Mess Booking</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Create an offline mess subscription for a student.</p>
      </div>

      {/* ═══ Step 1: Select Student ═══ */}
      <Separator className="my-0" />
      <div className="px-3 pt-2">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">1</div>
          <Label className="text-sm font-semibold text-foreground">Select Student</Label>
        </div>

        <div className="relative" ref={studentSearchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone or email..."
              value={studentQuery}
              onChange={(e) => { setStudentQuery(e.target.value); setShowResults(true); if (!e.target.value) { setSelectedUserId(''); setSelectedStudentName(''); } }}
              className="pl-9 h-9"
            />
            {studentSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          {showResults && studentResults.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {studentResults.map((s) => (
                <button key={s.id} className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b last:border-0 transition-colors" onClick={() => handleStudentSelect(s)}>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.email} {s.phone ? `• ${s.phone}` : ''}</p>
                </button>
              ))}
            </div>
          )}

          {showResults && studentQuery.length >= 2 && !studentSearching && studentResults.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg p-3">
              <p className="text-xs text-muted-foreground">No students found. Create a new one below.</p>
            </div>
          )}
        </div>

        {selectedStudentName && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary/10 text-secondary rounded-full px-3 py-1">
              <Check className="h-3 w-3" />
              {selectedStudentName}
            </span>
          </div>
        )}

        <Collapsible open={showNewStudent} onOpenChange={setShowNewStudent}>
          <CollapsibleTrigger asChild>
            <button className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-colors cursor-pointer">
              <UserPlus className="h-3.5 w-3.5" />
              {showNewStudent ? 'Hide' : 'Create New Student'}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2 bg-muted/20 rounded-xl p-2.5 border border-border/50">
            <div>
              <Label className="text-xs text-muted-foreground">Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Student name" className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email *</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="student@email.com" className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number" className="h-9" />
            </div>
            <Button size="sm" onClick={handleCreateStudent} disabled={creatingStudent} className="w-full">
              {creatingStudent ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creating...</> : 'Create & Select Student'}
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ═══ Step 2: Select Mess ═══ */}
      {selectedUserId && (
        <>
          <Separator className="my-0 mt-3" />
          <div className="px-3 pt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">2</div>
              <Label className="text-sm font-semibold text-foreground">Select Mess</Label>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
              {messes.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No mess found.</p>
              ) : (
                messes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleMessSelect(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      selectedMess?.id === m.id
                        ? 'bg-secondary text-secondary-foreground border-secondary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-secondary/50'
                    }`}
                  >
                    {m.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══ Step 3: Select Package ═══ */}
      {selectedMess && (
        <>
          <Separator className="my-0" />
          <div className="px-3 pt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">3</div>
              <Label className="text-sm font-semibold text-foreground">Select Package</Label>
            </div>
            {packages.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No packages found for this mess.</p>
            ) : (
              <div className="flex gap-1.5 flex-wrap pb-2">
                {packages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePackageSelect(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      selectedPackage?.id === p.id
                        ? 'bg-secondary text-secondary-foreground border-secondary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-secondary/50'
                    }`}
                  >
                    {p.name} · {formatCurrency(p.price)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ Step 4: Select Dates ═══ */}
      {selectedPackage && (
        <>
          <Separator className="my-0" />
          <div className="px-3 pt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">4</div>
              <Label className="text-sm font-semibold text-foreground">Select Dates</Label>
            </div>

            <div className="flex items-end gap-2 bg-muted/20 rounded-xl p-2.5 border border-border/50">
              <div className="flex-1">
                <Label className="block mb-1 text-xs text-muted-foreground">Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} className="h-9" />
              </div>
              <div className="w-28">
                <Label className="block mb-1 text-xs text-muted-foreground">Duration</Label>
                <Input value={`${selectedPackage.duration_count || 1} ${selectedPackage.duration_type || 'month'}`} disabled className="h-9" />
              </div>
            </div>

            {endDate && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary/10 text-secondary rounded-full px-3 py-1">
                  <CalendarIcon className="h-3 w-3" />
                  Ends: {endDate}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ Step 5: Payment Details ═══ */}
      {selectedPackage && endDate && (
        <>
          <Separator className="my-0 mt-3" />
          <div className="px-3 pt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">5</div>
              <Label className="text-sm font-semibold text-foreground">Payment Details</Label>
            </div>

            {/* Payment method pills */}
            <div className="mb-2">
              <Label className="block mb-1 text-xs text-muted-foreground">Payment Method</Label>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all ${
                      paymentMethod === pm.value
                        ? 'bg-secondary text-secondary-foreground border-secondary'
                        : 'bg-muted/50 text-muted-foreground border-border hover:border-secondary/50'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted/20 rounded-xl p-2.5 border border-border/50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Package Price</Label>
                  <Input type="number" value={pricePaid} onChange={(e) => setPricePaid(Number(e.target.value))} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Discount</Label>
                  <Input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(Number(e.target.value))} className="h-9" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Collecting Now</Label>
                  <Input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(Number(e.target.value))} className="h-9" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Transaction ID</Label>
                  <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} className="h-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Collected By</Label>
                <Input value={collectedByName} onChange={(e) => setCollectedByName(e.target.value)} placeholder={user?.name || ''} className="h-9" />
              </div>
            </div>

            {paymentMethod !== 'cash' && (
              <div className="mt-2">
                <PaymentProofUpload value={paymentProofUrl} onChange={setPaymentProofUrl} />
              </div>
            )}

            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-sm" />
            </div>
          </div>
        </>
      )}

      {/* ═══ Step 6: Review & Create ═══ */}
      {selectedPackage && endDate && (
        <>
          <Separator className="my-0 mt-3" />
          <div className="px-3 pt-2 pb-6">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[10px] font-bold">6</div>
              <Label className="text-sm font-semibold text-foreground">Review & Create</Label>
            </div>

            <div className="bg-muted/30 rounded-xl border border-border/50 divide-y divide-border/50">
              {/* Booking Summary */}
              <div className="p-3 space-y-1.5 text-xs">
                <h4 className="text-sm font-semibold text-foreground mb-2">Booking Summary</h4>
                <div className="flex justify-between"><span className="text-muted-foreground">Student</span><span className="font-medium text-foreground">{selectedStudentName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mess</span><span className="font-medium text-foreground">{selectedMess?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium text-foreground">{selectedPackage?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Start Date</span><span className="font-medium text-foreground">{startDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">End Date</span><span className="font-medium text-foreground">{endDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium text-foreground capitalize">{paymentMethod.replace('_', ' ')}</span></div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3 space-y-1.5 text-xs">
                <h4 className="text-sm font-semibold text-foreground mb-2">Price Breakdown</h4>
                <div className="flex justify-between"><span className="text-muted-foreground">Package Price</span><span className="font-medium text-foreground">{formatCurrency(pricePaid)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-{formatCurrency(discountAmount)}</span></div>}
                <Separator className="my-1.5 opacity-50" />
                <div className="flex justify-between text-sm"><span className="font-semibold text-foreground">Total</span><span className="font-bold text-secondary">{formatCurrency(totalAfterDiscount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Collecting Now</span><span className="font-medium text-foreground">{formatCurrency(advanceAmount)}</span></div>
                {dueAmount > 0 && <div className="flex justify-between text-destructive font-medium"><span>Due Amount</span><span>{formatCurrency(dueAmount)}</span></div>}
              </div>

              {/* Create Button */}
              <div className="p-3">
                <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create Subscription
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
