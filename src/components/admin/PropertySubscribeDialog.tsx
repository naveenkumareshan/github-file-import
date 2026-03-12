import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Loader2, Tag, X, ArrowRight, Check, Minus, Plus } from 'lucide-react';
import { couponService } from '@/api/couponService';

const PLAN_ICONS: Record<string, string> = { silver: '🥈', gold: '🥇', platinum: '💎', diamond: '👑' };

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface PropertySubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyName: string;
  propertyType: 'reading_room' | 'hostel';
  partnerId?: string;
  onSuccess?: () => void;
}

export function PropertySubscribeDialog({
  open, onOpenChange, propertyId, propertyName, propertyType, partnerId, onSuccess,
}: PropertySubscribeDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [capacityUpgrades, setCapacityUpgrades] = useState(0);
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponValidation, setCouponValidation] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans-active'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      return data || [];
    },
    enabled: open,
  });

  // Get current subscription's display_order to filter upgrades only
  const { data: currentSubOrder } = useQuery({
    queryKey: ['current-sub-order', propertyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_subscriptions')
        .select('plan_id, subscription_plans(display_order)')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as any)?.subscription_plans?.display_order || 0;
    },
    enabled: open && !!propertyId,
  });

  const availablePlans = plans.filter((p: any) => p.display_order > (currentSubOrder || 0) && !(p as any).is_universal);

  const getDiscountedPrice = (plan: any) => {
    if (plan.discount_active && plan.discount_percentage > 0) {
      return plan.price_yearly - (plan.price_yearly * plan.discount_percentage / 100);
    }
    return plan.price_yearly;
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setCouponLoading(true);
    try {
      const preTotal = getDiscountedPrice(selectedPlan) + (capacityUpgrades > 0 && selectedPlan?.capacity_upgrade_enabled ? capacityUpgrades * (selectedPlan?.capacity_upgrade_price || 0) * 12 : 0);
      const result = await couponService.validateCoupon(couponCode, 'subscription', preTotal);
      if (result.success && result.data) {
        setCouponValidation(result.data);
        toast({ title: '✅ Coupon Applied', description: `You save ₹${Math.round(result.data.discountAmount)}` });
      } else {
        toast({ title: 'Invalid Coupon', description: result.message || 'Could not apply coupon', variant: 'destructive' });
        setCouponValidation(null);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to validate coupon', variant: 'destructive' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPlan) return;
    setProcessing(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load payment SDK.');

      const { data, error } = await supabase.functions.invoke('subscription-create-order', {
        body: {
          planId: selectedPlan.id,
          propertyId,
          propertyType: propertyType === 'reading_room' ? 'reading_room' : 'hostel',
          capacityUpgrades,
          couponCode: couponValidation ? couponCode.toUpperCase() : undefined,
        },
      });
      if (error) throw error;

      if (data.testMode) {
        const { error: verifyError } = await supabase.functions.invoke('subscription-verify-payment', {
          body: { subscriptionId: data.subscriptionId, testMode: true },
        });
        if (verifyError) throw verifyError;
        toast({ title: '✅ Subscription Activated (Test)', description: `${selectedPlan.name} plan for ${propertyName}` });
        invalidateAndClose();
        return;
      }

      const options = {
        key: data.KEY_ID,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'InhaleStays',
        description: `${selectedPlan.name} Plan - ${propertyName}`,
        order_id: data.id,
        handler: async (response: any) => {
          try {
            const { error: verifyError } = await supabase.functions.invoke('subscription-verify-payment', {
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                subscriptionId: data.subscriptionId,
              },
            });
            if (verifyError) throw verifyError;
            toast({ title: '✅ Subscription Activated!', description: `${selectedPlan.name} plan for ${propertyName}` });
            invalidateAndClose();
          } catch (e: any) {
            toast({ title: 'Verification failed', description: e.message, variant: 'destructive' });
          }
        },
        theme: { color: '#3b7b8a' },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast({ title: 'Payment Error', description: e.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const invalidateAndClose = () => {
    queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
    queryClient.invalidateQueries({ queryKey: ['property-subscription', propertyId] });
    queryClient.invalidateQueries({ queryKey: ['universal-subscription'] });
    onOpenChange(false);
    setStep(1);
    setSelectedPlan(null);
    setCapacityUpgrades(0);
    setCouponCode('');
    setCouponValidation(null);
    setProcessing(false);
    onSuccess?.();
  };

  const planYearlyPrice = selectedPlan ? getDiscountedPrice(selectedPlan) : 0;
  const capacityUpgradeYearly = capacityUpgrades > 0 && selectedPlan?.capacity_upgrade_enabled ? capacityUpgrades * (selectedPlan?.capacity_upgrade_price || 0) * 12 : 0;
  const couponDiscount = couponValidation ? Math.round(couponValidation.discountAmount) : 0;
  const totalAmount = selectedPlan ? Math.max(0, planYearlyPrice + capacityUpgradeYearly - couponDiscount) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setStep(1); setSelectedPlan(null); } onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {step === 1 && `Subscribe — ${propertyName}`}
            {step === 2 && 'Capacity Upgrades'}
            {step === 3 && 'Order Summary'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select Plan */}
        {step === 1 && (
          <div className="space-y-3">
            {availablePlans.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">No plans available.</p>
            ) : availablePlans.map((plan: any) => {
              const hasDiscount = plan.discount_active && plan.discount_percentage > 0;
              const discountedPrice = getDiscountedPrice(plan);
              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all hover:border-primary ${selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/20' : ''}`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className="p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{PLAN_ICONS[plan.slug] || '📋'}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">₹{plan.price_monthly_display}/mo (billed yearly)</p>
                      </div>
                      {hasDiscount && (
                        <Badge variant="destructive" className="text-[9px]">{plan.discount_label || `${plan.discount_percentage}% OFF`}</Badge>
                      )}
                      {selectedPlan?.id === plan.id && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasDiscount ? (
                        <>
                          <p className="text-xs line-through text-muted-foreground">₹{plan.price_yearly}</p>
                          <p className="text-xs font-bold text-primary">₹{Math.round(discountedPrice)}/year</p>
                        </>
                      ) : (
                        <p className="text-xs font-medium">₹{plan.price_yearly}/year</p>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      <span>Hostel: {plan.hostel_bed_limit === 0 ? 'Unlimited' : `${plan.hostel_bed_limit} beds`}</span>
                      <span className="mx-2">•</span>
                      <span>Reading Room: {plan.reading_room_seat_limit === 0 ? 'Unlimited' : `${plan.reading_room_seat_limit} seats`}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(plan.features) ? plan.features : []).slice(0, 4).map((f: string) => (
                        <Badge key={f} variant="secondary" className="text-[9px]">{f.replace(/_/g, ' ')}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Button
              className="w-full"
              disabled={!selectedPlan}
              onClick={() => setStep(selectedPlan?.capacity_upgrade_enabled ? 2 : 3)}
            >
              Continue <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Capacity Upgrades */}
        {step === 2 && selectedPlan && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add capacity upgrades at ₹{selectedPlan.capacity_upgrade_price}/mo per slab
              ({propertyType === 'hostel' ? `${selectedPlan.capacity_upgrade_slab_beds} beds` : `${selectedPlan.capacity_upgrade_slab_seats} seats`} each)
            </p>
            <div className="flex items-center gap-4 justify-center">
              <Button size="icon" variant="outline" onClick={() => setCapacityUpgrades(Math.max(0, capacityUpgrades - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="text-2xl font-bold w-8 text-center">{capacityUpgrades}</span>
              <Button size="icon" variant="outline" onClick={() => setCapacityUpgrades(capacityUpgrades + 1)}><Plus className="h-4 w-4" /></Button>
            </div>
            {capacityUpgrades > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                +₹{capacityUpgrades * selectedPlan.capacity_upgrade_price * 12}/year
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1">Continue</Button>
            </div>
          </div>
        )}

        {/* Step 3: Summary & Payment */}
        {step === 3 && selectedPlan && (
          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>Property</span><span className="font-medium">{propertyName}</span></div>
              <div className="flex justify-between"><span>Plan</span><span className="font-medium">{selectedPlan.name}</span></div>
              <div className="flex justify-between"><span>Plan Price</span><span>₹{Math.round(planYearlyPrice)}/yr</span></div>
              {capacityUpgradeYearly > 0 && (
                <div className="flex justify-between"><span>Capacity Upgrades</span><span>₹{capacityUpgradeYearly}/yr</span></div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Coupon Discount</span><span>-₹{couponDiscount}</span></div>
              )}
              <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>₹{Math.round(totalAmount)}</span></div>
            </div>

            {/* Coupon */}
            <div className="space-y-2">
              <Label className="text-xs">Coupon Code</Label>
              {couponValidation ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <Tag className="h-3 w-3" />
                  <span>{couponCode.toUpperCase()} applied — ₹{couponDiscount} off</span>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => { setCouponCode(''); setCouponValidation(null); }}><X className="h-3 w-3" /></Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder="Enter code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="h-8 text-xs" />
                  <Button size="sm" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()} className="h-8 text-xs">
                    {couponLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(selectedPlan?.capacity_upgrade_enabled ? 2 : 1)} className="flex-1">Back</Button>
              <Button onClick={handlePayment} disabled={processing} className="flex-1">
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Processing</> : <><CreditCard className="h-4 w-4 mr-1" />Pay ₹{Math.round(totalAmount)}</>}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
