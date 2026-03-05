
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';
import { PaymentGatewaySettings } from '@/components/admin/settings/PaymentGatewaySettings';
import { EmailSettings } from '@/components/admin/settings/EmailSettings';
import { SmsSettings } from '@/components/admin/settings/SmsSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, Loader2 } from 'lucide-react';

function PartnerTrialDaysConfig() {
  const { toast } = useToast();
  const [days, setDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('platform_config')
        .select('value')
        .eq('key', 'partner_trial_days')
        .maybeSingle();
      if (data?.value && typeof data.value === 'object' && 'days' in (data.value as any)) {
        setDays((data.value as any).days);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('platform_config')
      .upsert({ key: 'partner_trial_days', value: { days }, updated_at: new Date().toISOString() } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Partner trial days updated.' });
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Partner Free Trial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="trial-days" className="text-sm">Free Trial Days for New Partners</Label>
          <p className="text-xs text-muted-foreground">Number of days a new partner can add properties without a subscription.</p>
          <div className="flex items-center gap-2">
            <Input
              id="trial-days"
              type="number"
              min={0}
              max={365}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">days</span>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSettingsNew() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">System Configuration</h1>
        <p className="text-muted-foreground">Manage site settings and integrations</p>
      </div>
      
      <Tabs defaultValue="site" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="site">Site Settings</TabsTrigger>
          <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
          <TabsTrigger value="email">Email Configuration</TabsTrigger>
          <TabsTrigger value="sms">SMS Configuration</TabsTrigger>
          <TabsTrigger value="platform">Platform Config</TabsTrigger>
        </TabsList>
        
        <TabsContent value="site" className="mt-6">
          <SiteSettingsForm />
        </TabsContent>
        
        <TabsContent value="payment" className="mt-6">
          <PaymentGatewaySettings />
        </TabsContent>
        
        <TabsContent value="email" className="mt-6">
          <EmailSettings />
        </TabsContent>
        
        <TabsContent value="sms" className="mt-6">
          <SmsSettings />
        </TabsContent>

        <TabsContent value="platform" className="mt-6">
          <div className="space-y-4">
            <PartnerTrialDaysConfig />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
