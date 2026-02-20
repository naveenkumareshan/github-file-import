
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { settingsService } from '@/api/settingsService';

interface PaymentSettings {
  razorpay: {
    enabled: boolean;
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    testMode: boolean;
  };
  // stripe: {
  //   enabled: boolean;
  //   publishableKey: string;
  //   secretKey: string;
  //   webhookSecret: string;
  //   testMode: boolean;
  // };
  // paypal: {
  //   enabled: boolean;
  //   clientId: string;
  //   clientSecret: string;
  //   testMode: boolean;
  // };
  defaultGateway: string;
}

export function PaymentGatewaySettings() {
  const [settings, setSettings] = useState<PaymentSettings>({
    razorpay: {
      enabled: true,
      keyId: '',
      keySecret: '',
      webhookSecret: '',
      testMode: true
    },
    // stripe: {
    //   enabled: false,
    //   publishableKey: '',
    //   secretKey: '',
    //   webhookSecret: '',
    //   testMode: true
    // },
    // paypal: {
    //   enabled: false,
    //   clientId: '',
    //   clientSecret: '',
    //   testMode: true
    // },
    defaultGateway: 'razorpay'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

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
        
        setSettings(prev => ({
          ...prev,
          ...paymentSettings
        }));
      }
    } catch (error) {
      console.error('Error loading payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to load payment settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save each gateway settings
      for (const [provider, config] of Object.entries(settings)) {
        if (provider !== 'defaultGateway') {
          await settingsService.saveSettings({
            category: 'payment',
            provider,
            settings: config,
            isActive: true
          });
        }
      }
      
      // Save default gateway
      await settingsService.saveSettings({
        category: 'payment',
        provider: 'default',
        settings: { gateway: settings.defaultGateway },
        isActive: true
      });

      toast({
        title: "Settings saved",
        description: "Payment gateway settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: "Error",
        description: "Failed to save payment gateway settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateGatewaySettings = (gateway: keyof Omit<PaymentSettings, 'defaultGateway'>, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway],
        [field]: value
      }
    }));
  };

  if (isLoadingSettings) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Gateway Configuration</CardTitle>
        <CardDescription>
          Configure payment gateways for processing transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="razorpay" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="razorpay">Razorpay</TabsTrigger>
            {/* <TabsTrigger value="stripe">Stripe</TabsTrigger> */}
            {/* <TabsTrigger value="paypal">PayPal</TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="razorpay" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Razorpay Integration</h3>
                <p className="text-sm text-muted-foreground">Configure Razorpay payment gateway</p>
              </div>
              <Switch
                checked={settings.razorpay.enabled}
                onCheckedChange={(enabled) => updateGatewaySettings('razorpay', 'enabled', enabled)}
              />
            </div>
            
            {settings.razorpay.enabled && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="razorpay-key-id">Key ID</Label>
                  <Input
                    id="razorpay-key-id"
                    value={settings.razorpay.keyId}
                    onChange={(e) => updateGatewaySettings('razorpay', 'keyId', e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxxxxxx"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="razorpay-key-secret">Key Secret</Label>
                  <Input
                    id="razorpay-key-secret"
                    type="password"
                    value={settings.razorpay.keySecret}
                    onChange={(e) => updateGatewaySettings('razorpay', 'keySecret', e.target.value)}
                    placeholder="Enter your Razorpay key secret"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="razorpay-webhook">Webhook Secret</Label>
                  <Input
                    id="razorpay-webhook"
                    type="password"
                    value={settings.razorpay.webhookSecret}
                    onChange={(e) => updateGatewaySettings('razorpay', 'webhookSecret', e.target.value)}
                    placeholder="Enter webhook secret"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="razorpay-test-mode"
                    checked={settings.razorpay.testMode}
                    onCheckedChange={(testMode) => updateGatewaySettings('razorpay', 'testMode', testMode)}
                  />
                  <Label htmlFor="razorpay-test-mode">Test Mode</Label>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* <TabsContent value="stripe" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Stripe Integration</h3>
                <p className="text-sm text-muted-foreground">Configure Stripe payment gateway</p>
              </div>
              <Switch
                checked={settings.stripe.enabled}
                onCheckedChange={(enabled) => updateGatewaySettings('stripe', 'enabled', enabled)}
              />
            </div>
            
            {settings.stripe.enabled && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="stripe-publishable-key">Publishable Key</Label>
                  <Input
                    id="stripe-publishable-key"
                    value={settings.stripe.publishableKey}
                    onChange={(e) => updateGatewaySettings('stripe', 'publishableKey', e.target.value)}
                    placeholder="pk_test_xxxxxxxxxxxxxx"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="stripe-secret-key">Secret Key</Label>
                  <Input
                    id="stripe-secret-key"
                    type="password"
                    value={settings.stripe.secretKey}
                    onChange={(e) => updateGatewaySettings('stripe', 'secretKey', e.target.value)}
                    placeholder="sk_test_xxxxxxxxxxxxxx"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="stripe-webhook">Webhook Secret</Label>
                  <Input
                    id="stripe-webhook"
                    type="password"
                    value={settings.stripe.webhookSecret}
                    onChange={(e) => updateGatewaySettings('stripe', 'webhookSecret', e.target.value)}
                    placeholder="whsec_xxxxxxxxxxxxxx"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stripe-test-mode"
                    checked={settings.stripe.testMode}
                    onCheckedChange={(testMode) => updateGatewaySettings('stripe', 'testMode', testMode)}
                  />
                  <Label htmlFor="stripe-test-mode">Test Mode</Label>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="paypal" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">PayPal Integration</h3>
                <p className="text-sm text-muted-foreground">Configure PayPal payment gateway</p>
              </div>
              <Switch
                checked={settings.paypal.enabled}
                onCheckedChange={(enabled) => updateGatewaySettings('paypal', 'enabled', enabled)}
              />
            </div>
            
            {settings.paypal.enabled && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="paypal-client-id">Client ID</Label>
                  <Input
                    id="paypal-client-id"
                    value={settings.paypal.clientId}
                    onChange={(e) => updateGatewaySettings('paypal', 'clientId', e.target.value)}
                    placeholder="Enter PayPal Client ID"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="paypal-client-secret">Client Secret</Label>
                  <Input
                    id="paypal-client-secret"
                    type="password"
                    value={settings.paypal.clientSecret}
                    onChange={(e) => updateGatewaySettings('paypal', 'clientSecret', e.target.value)}
                    placeholder="Enter PayPal Client Secret"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="paypal-test-mode"
                    checked={settings.paypal.testMode}
                    onCheckedChange={(testMode) => updateGatewaySettings('paypal', 'testMode', testMode)}
                  />
                  <Label htmlFor="paypal-test-mode">Sandbox Mode</Label>
                </div>
              </div>
            )}
          </TabsContent> */}
        </Tabs>
        
        <div className="mt-6 pt-6 border-t">
          <div className="space-y-2">
            <Label htmlFor="default-gateway">Default Payment Gateway</Label>
            <Select value={settings.defaultGateway} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultGateway: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select default gateway" />
              </SelectTrigger>
              <SelectContent>
                {settings.razorpay.enabled && <SelectItem value="razorpay">Razorpay</SelectItem>}
                {/* {settings.stripe.enabled && <SelectItem value="stripe">Stripe</SelectItem>} */}
                {/* {settings.paypal.enabled && <SelectItem value="paypal">PayPal</SelectItem>} */}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-6">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Payment Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
