
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Settings, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { vendorService, AutoPayoutSettings } from '@/api/vendorService';
import { useToast } from '@/hooks/use-toast';

export const AutoPayoutSettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<AutoPayoutSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const result = await vendorService.getAutoPayoutSettings();
    
    if (result.success) {
      setSettings(result.data.data);
    } else {
      toast({
        title: "Error",
        description: "Failed to fetch auto payout settings",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    const result = await vendorService.updateAutoPayoutSettings(settings);
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Auto payout settings updated successfully"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive"
      });
    }
    setSaving(false);
  };

  const updateSettings = (field: string, value: any) => {
    if (!settings) return;
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings({
        ...settings,
        [parent]: {
          ...(settings as any)[parent],
          [child]: value
        }
      });
    } else {
      setSettings({
        ...settings,
        [field]: value
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Failed to load settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Auto Payout Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auto Payout Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Auto Payout */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Auto Payout</Label>
              <p className="text-sm text-muted-foreground">
                Automatically process payouts based on schedule
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Payout Frequency */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Payout Frequency</Label>
            <Select
              value={settings.payoutFrequency.toString()}
              onValueChange={(value) => updateSettings('payoutFrequency', parseInt(value))}
              disabled={!settings.enabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Every 5 days</SelectItem>
                <SelectItem value="7">Every 7 days (Weekly)</SelectItem>
                <SelectItem value="10">Every 10 days</SelectItem>
                <SelectItem value="15">Every 15 days</SelectItem>
                <SelectItem value="30">Every 30 days (Monthly)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Per Cabin Payout */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Per Cabin Payout</Label>
              <p className="text-sm text-muted-foreground">
                Create separate payouts for each cabin
              </p>
            </div>
            <Switch
              checked={settings.perCabinPayout}
              onCheckedChange={(checked) => updateSettings('perCabinPayout', checked)}
              disabled={!settings.enabled}
            />
          </div>

          {/* Minimum Payout Amount */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Minimum Payout Amount</Label>
            <Input
              type="number"
              value={settings.minimumPayoutAmount}
              onChange={(e) => updateSettings('minimumPayoutAmount', parseFloat(e.target.value) || 0)}
              placeholder="Enter minimum amount"
              disabled={!settings.enabled}
            />
            <p className="text-sm text-muted-foreground">
              Payouts will only be processed if the amount exceeds this limit
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual Request Charges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Manual Request Charges
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Manual Charges */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Manual Request Charges</Label>
              <p className="text-sm text-muted-foreground">
                Charge extra fees for manual payout requests
              </p>
            </div>
            <Switch
              checked={settings.manualRequestCharges.enabled}
              onCheckedChange={(checked) => updateSettings('manualRequestCharges.enabled', checked)}
            />
          </div>

          {settings.manualRequestCharges.enabled && (
            <>
              <Separator />

              {/* Charge Type */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Charge Type</Label>
                <Select
                  value={settings.manualRequestCharges.chargeType}
                  onValueChange={(value) => updateSettings('manualRequestCharges.chargeType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select charge type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Charge Value */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Charge Value {settings.manualRequestCharges.chargeType === 'percentage' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  type="number"
                  value={settings.manualRequestCharges.chargeValue}
                  onChange={(e) => updateSettings('manualRequestCharges.chargeValue', parseFloat(e.target.value) || 0)}
                  placeholder={settings.manualRequestCharges.chargeType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                />
              </div>

              {/* Charge Description */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Charge Description</Label>
                <Input
                  value={settings.manualRequestCharges.description}
                  onChange={(e) => updateSettings('manualRequestCharges.description', e.target.value)}
                  placeholder="Enter description for the charge"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Payout Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <Badge variant={settings.enabled ? "default" : "secondary"}>
                {settings.enabled ? "Auto Payout Enabled" : "Auto Payout Disabled"}
              </Badge>
            </div>
            
            {settings.nextAutoPayout && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Next Auto Payout</Label>
                <p className="text-sm font-medium">
                  {new Date(settings.nextAutoPayout).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {settings.enabled && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-700">
                Auto payouts will be processed every {settings.payoutFrequency} days
                {settings.perCabinPayout ? ' (separately for each cabin)' : ' (combined for all cabins)'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
