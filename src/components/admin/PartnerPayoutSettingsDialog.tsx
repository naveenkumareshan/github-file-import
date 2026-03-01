
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { settlementService, PartnerPayoutSettings } from '@/api/settlementService';
import { Loader2 } from 'lucide-react';

interface Props {
  partnerId: string;
  open: boolean;
  onClose: () => void;
}

export const PartnerPayoutSettingsDialog: React.FC<Props> = ({ partnerId, open, onClose }) => {
  const [settings, setSettings] = useState<Partial<PartnerPayoutSettings>>({
    settlement_cycle: 'monthly',
    commission_type: 'percentage',
    commission_percentage: 10,
    commission_fixed: 0,
    commission_on: 'room_rent',
    gateway_charge_mode: 'absorb_platform',
    gateway_split_percentage: 50,
    tds_enabled: false,
    tds_percentage: 0,
    security_hold_enabled: false,
    security_hold_percentage: 0,
    security_hold_days: 30,
    minimum_payout_amount: 500,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && partnerId) {
      setLoading(true);
      settlementService.getPartnerPayoutSettings(partnerId).then(({ data }) => {
        if (data) setSettings(data);
        setLoading(false);
      });
    }
  }, [open, partnerId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await settlementService.updatePartnerPayoutSettings(partnerId, settings);
    if (error) toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    else { toast({ title: 'Saved', description: 'Payout settings updated' }); onClose(); }
    setSaving(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Payout Settings</DialogTitle></DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Settlement Cycle</Label>
              <Select value={settings.settlement_cycle} onValueChange={v => setSettings(s => ({ ...s, settlement_cycle: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="7_day_hold">7 Days Hold</SelectItem>
                  <SelectItem value="15_day_hold">15 Days Hold</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings.settlement_cycle === 'custom' && (
              <div><Label className="text-xs">Custom Days</Label><Input type="number" className="h-8 text-xs" value={settings.custom_cycle_days || ''} onChange={e => setSettings(s => ({ ...s, custom_cycle_days: parseInt(e.target.value) || null }))} /></div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Commission Type</Label>
                <Select value={settings.commission_type} onValueChange={v => setSettings(s => ({ ...s, commission_type: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Commission On</Label>
                <Select value={settings.commission_on} onValueChange={v => setSettings(s => ({ ...s, commission_on: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="room_rent">Room Rent Only</SelectItem>
                    <SelectItem value="room_and_food">Room + Food</SelectItem>
                    <SelectItem value="full_invoice">Full Invoice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(settings.commission_type === 'percentage' || settings.commission_type === 'hybrid') && (
                <div><Label className="text-xs">Commission %</Label><Input type="number" className="h-8 text-xs" value={settings.commission_percentage} onChange={e => setSettings(s => ({ ...s, commission_percentage: parseFloat(e.target.value) || 0 }))} /></div>
              )}
              {(settings.commission_type === 'fixed' || settings.commission_type === 'hybrid') && (
                <div><Label className="text-xs">Fixed Amount ₹</Label><Input type="number" className="h-8 text-xs" value={settings.commission_fixed} onChange={e => setSettings(s => ({ ...s, commission_fixed: parseFloat(e.target.value) || 0 }))} /></div>
              )}
            </div>

            <div>
              <Label className="text-xs">Gateway Charge Mode</Label>
              <Select value={settings.gateway_charge_mode} onValueChange={v => setSettings(s => ({ ...s, gateway_charge_mode: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass_to_partner">Pass to Partner</SelectItem>
                  <SelectItem value="absorb_platform">Absorb by Platform</SelectItem>
                  <SelectItem value="split">Split</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings.gateway_charge_mode === 'split' && (
              <div><Label className="text-xs">Gateway Split % (Partner pays)</Label><Input type="number" className="h-8 text-xs" value={settings.gateway_split_percentage} onChange={e => setSettings(s => ({ ...s, gateway_split_percentage: parseFloat(e.target.value) || 0 }))} /></div>
            )}

            <div className="flex items-center justify-between border rounded-md p-2">
              <Label className="text-xs">TDS Deduction</Label>
              <Switch checked={settings.tds_enabled} onCheckedChange={v => setSettings(s => ({ ...s, tds_enabled: v }))} />
            </div>
            {settings.tds_enabled && (
              <div><Label className="text-xs">TDS %</Label><Input type="number" className="h-8 text-xs" value={settings.tds_percentage} onChange={e => setSettings(s => ({ ...s, tds_percentage: parseFloat(e.target.value) || 0 }))} /></div>
            )}

            <div className="flex items-center justify-between border rounded-md p-2">
              <Label className="text-xs">Security Hold</Label>
              <Switch checked={settings.security_hold_enabled} onCheckedChange={v => setSettings(s => ({ ...s, security_hold_enabled: v }))} />
            </div>
            {settings.security_hold_enabled && (
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Hold %</Label><Input type="number" className="h-8 text-xs" value={settings.security_hold_percentage} onChange={e => setSettings(s => ({ ...s, security_hold_percentage: parseFloat(e.target.value) || 0 }))} /></div>
                <div><Label className="text-xs">Hold Days</Label><Input type="number" className="h-8 text-xs" value={settings.security_hold_days} onChange={e => setSettings(s => ({ ...s, security_hold_days: parseInt(e.target.value) || 30 }))} /></div>
              </div>
            )}

            <div><Label className="text-xs">Minimum Payout Amount ₹</Label><Input type="number" className="h-8 text-xs" value={settings.minimum_payout_amount} onChange={e => setSettings(s => ({ ...s, minimum_payout_amount: parseFloat(e.target.value) || 0 }))} /></div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Settings</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
