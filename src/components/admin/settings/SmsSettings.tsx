
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Send } from 'lucide-react';

interface SmsSettingsType {
  twilio: { enabled: boolean; accountSid: string; authToken: string; fromNumber: string; };
  msg91: { enabled: boolean; authKey: string; senderId: string; route: string; };
  textlocal: { enabled: boolean; apiKey: string; sender: string; };
  defaultProvider: string;
  templates: {
    bookingConfirmation: string;
    paymentConfirmation: string;
    bookingReminder: string;
    seatTransfer: string;
  };
}

export function SmsSettings() {
  const [settings, setSettings] = useState<SmsSettingsType>({
    twilio: { enabled: true, accountSid: '', authToken: '', fromNumber: '' },
    msg91: { enabled: false, authKey: '', senderId: '', route: '4' },
    textlocal: { enabled: false, apiKey: '', sender: '' },
    defaultProvider: 'twilio',
    templates: {
      bookingConfirmation: 'Your booking {bookingId} has been confirmed. Seat: {seatNumber}, Cabin: {cabinName}',
      paymentConfirmation: 'Payment of ₹{amount} received for booking {bookingId}. Thank you!',
      bookingReminder: 'Reminder: Your booking {bookingId} expires on {expiryDate}.',
      seatTransfer: 'Your seat has been transferred to {newSeat} in {newCabin}. Booking ID: {bookingId}'
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('smsSettings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('smsSettings', JSON.stringify(settings));
      toast({ title: 'Saved', description: 'SMS settings updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save SMS settings.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestSms = async () => {
    if (!testNumber) {
      toast({ title: 'Error', description: 'Please enter a test phone number.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({ title: 'Sent', description: `Test SMS sent to ${testNumber}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to send test SMS.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProvider = (provider: 'twilio' | 'msg91' | 'textlocal', field: string, value: any) => {
    setSettings(prev => ({ ...prev, [provider]: { ...prev[provider], [field]: value } }));
  };

  const updateTemplate = (key: keyof SmsSettingsType['templates'], value: string) => {
    setSettings(prev => ({ ...prev, templates: { ...prev.templates, [key]: value } }));
  };

  const providerSections = [
    {
      key: 'twilio' as const, label: 'Twilio', desc: 'International SMS via Twilio',
      fields: settings.twilio.enabled && (
        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <Label className="text-xs">Account SID</Label>
            <Input value={settings.twilio.accountSid} onChange={(e) => updateProvider('twilio', 'accountSid', e.target.value)} placeholder="ACxxxxx" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Auth Token</Label>
            <Input type="password" value={settings.twilio.authToken} onChange={(e) => updateProvider('twilio', 'authToken', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">From Number</Label>
            <Input value={settings.twilio.fromNumber} onChange={(e) => updateProvider('twilio', 'fromNumber', e.target.value)} placeholder="+1234567890" className="h-8 text-xs max-w-xs" />
          </div>
        </div>
      )
    },
    {
      key: 'msg91' as const, label: 'MSG91', desc: 'Indian SMS gateway',
      fields: settings.msg91.enabled && (
        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <Label className="text-xs">Auth Key</Label>
            <Input type="password" value={settings.msg91.authKey} onChange={(e) => updateProvider('msg91', 'authKey', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sender ID</Label>
            <Input value={settings.msg91.senderId} onChange={(e) => updateProvider('msg91', 'senderId', e.target.value)} placeholder="INHALE" className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Route</Label>
            <Select value={settings.msg91.route} onValueChange={(v) => updateProvider('msg91', 'route', v)}>
              <SelectTrigger className="h-8 text-xs max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Promotional</SelectItem>
                <SelectItem value="4">Transactional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    {
      key: 'textlocal' as const, label: 'TextLocal', desc: 'Bulk SMS provider',
      fields: settings.textlocal.enabled && (
        <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <Label className="text-xs">API Key</Label>
            <Input type="password" value={settings.textlocal.apiKey} onChange={(e) => updateProvider('textlocal', 'apiKey', e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sender</Label>
            <Input value={settings.textlocal.sender} onChange={(e) => updateProvider('textlocal', 'sender', e.target.value)} placeholder="INHALE" className="h-8 text-xs" />
          </div>
        </div>
      )
    }
  ];

  const templateFields: { key: keyof SmsSettingsType['templates']; label: string }[] = [
    { key: 'bookingConfirmation', label: 'Booking Confirmation' },
    { key: 'paymentConfirmation', label: 'Payment Confirmation' },
    { key: 'bookingReminder', label: 'Booking Reminder' },
    { key: 'seatTransfer', label: 'Seat Transfer' },
  ];

  return (
    <div className="space-y-4">
      {/* Providers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">SMS Providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {providerSections.map(({ key, label, desc, fields }) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={settings[key].enabled} onCheckedChange={(v) => updateProvider(key, 'enabled', v)} className="scale-90" />
              </div>
              {fields}
            </div>
          ))}

          <div className="space-y-1.5 pt-3 border-t border-border">
            <Label className="text-xs">Default SMS Provider</Label>
            <Select value={settings.defaultProvider} onValueChange={(v) => setSettings(prev => ({ ...prev, defaultProvider: v }))}>
              <SelectTrigger className="h-8 text-xs max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {settings.twilio.enabled && <SelectItem value="twilio">Twilio</SelectItem>}
                {settings.msg91.enabled && <SelectItem value="msg91">MSG91</SelectItem>}
                {settings.textlocal.enabled && <SelectItem value="textlocal">TextLocal</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-border">
            <Label className="text-xs">Send Test SMS</Label>
            <div className="flex gap-2">
              <Input value={testNumber} onChange={(e) => setTestNumber(e.target.value)} placeholder="+91xxxxxxxxxx" className="h-8 text-xs flex-1 max-w-xs" />
              <Button size="sm" variant="outline" onClick={sendTestSms} disabled={isLoading || !testNumber} className="h-8 text-[11px] gap-1 px-2.5">
                <Send className="h-3 w-3" />Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">SMS Templates</CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Use variables: {'{bookingId}'}, {'{seatNumber}'}, {'{cabinName}'}, {'{amount}'}, {'{expiryDate}'}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {templateFields.map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Textarea
                value={settings.templates[key]}
                onChange={(e) => updateTemplate(key, e.target.value)}
                className="text-xs min-h-[60px] resize-none"
                rows={2}
              />
            </div>
          ))}
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
