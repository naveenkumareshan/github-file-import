
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { settingsService } from '@/api/settingsService';
import { Save, Loader2 } from 'lucide-react';

interface PaymentSettings {
  razorpay: {
    enabled: boolean;
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    testMode: boolean;
  };
  defaultGateway: string;
}

export function PaymentGatewaySettings() {
  const [settings, setSettings] = useState<PaymentSettings>({
    razorpay: { enabled: true, keyId: '', keySecret: '', webhookSecret: '', testMode: true },
    defaultGateway: 'razorpay'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { toast } = useToast();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await settingsService.getSettings('payment');
      if (response.success && response.data.length > 0) {
        const paymentSettings = response.data.reduce((acc: any, setting: any) => {
          if (setting.provider === 'default') {
            acc.defaultGateway = setting.settings.gateway || 'razorpay';
          } else if (setting.provider && setting.provider !== 'default') {
            acc[setting.provider] = setting.settings;
          }
          return acc;
        }, {});
        setSettings(prev => ({ ...prev, ...paymentSettings }));
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
      toast({ title: 'Error', description: 'Failed to load payment settings.', variant: 'destructive' });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      for (const [provider, config] of Object.entries(settings)) {
        if (provider !== 'defaultGateway') {
          await settingsService.saveSettings({ category: 'payment', provider, settings: config, isActive: true });
        }
      }
      await settingsService.saveSettings({ category: 'payment', provider: 'default', settings: { gateway: settings.defaultGateway }, isActive: true });
      toast({ title: 'Saved', description: 'Payment gateway settings updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save payment settings.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateGatewaySettings = (gateway: 'razorpay', field: string, value: any) => {
    setSettings(prev => ({ ...prev, [gateway]: { ...prev[gateway], [field]: value } }));
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Razorpay Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium">Enable Razorpay</p>
              <p className="text-[11px] text-muted-foreground">Accept payments via Razorpay gateway</p>
            </div>
            <Switch
              checked={settings.razorpay.enabled}
              onCheckedChange={(enabled) => updateGatewaySettings('razorpay', 'enabled', enabled)}
              className="scale-90"
            />
          </div>

          {settings.razorpay.enabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Key ID</Label>
                  <Input
                    value={settings.razorpay.keyId}
                    onChange={(e) => updateGatewaySettings('razorpay', 'keyId', e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxxxxxx"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Key Secret</Label>
                  <Input
                    type="password"
                    value={settings.razorpay.keySecret}
                    onChange={(e) => updateGatewaySettings('razorpay', 'keySecret', e.target.value)}
                    placeholder="Enter key secret"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Webhook Secret</Label>
                <Input
                  type="password"
                  value={settings.razorpay.webhookSecret}
                  onChange={(e) => updateGatewaySettings('razorpay', 'webhookSecret', e.target.value)}
                  placeholder="Enter webhook secret"
                  className="h-8 text-xs max-w-sm"
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium">Test Mode</p>
                  <p className="text-[11px] text-muted-foreground">Use test credentials for development</p>
                </div>
                <Switch
                  checked={settings.razorpay.testMode}
                  onCheckedChange={(testMode) => updateGatewaySettings('razorpay', 'testMode', testMode)}
                  className="scale-90"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Default Gateway</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-xs">Active Payment Gateway</Label>
            <Select value={settings.defaultGateway} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultGateway: value }))}>
              <SelectTrigger className="h-8 text-xs max-w-xs">
                <SelectValue placeholder="Select default gateway" />
              </SelectTrigger>
              <SelectContent>
                {settings.razorpay.enabled && <SelectItem value="razorpay">Razorpay</SelectItem>}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-1">
        <Button size="sm" onClick={handleSave} disabled={isLoading} className="gap-1.5 text-xs h-8">
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
