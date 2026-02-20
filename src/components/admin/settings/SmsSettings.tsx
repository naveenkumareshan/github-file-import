
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface SmsSettings {
  twilio: {
    enabled: boolean;
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  msg91: {
    enabled: boolean;
    authKey: string;
    senderId: string;
    route: string;
  };
  textlocal: {
    enabled: boolean;
    apiKey: string;
    sender: string;
  };
  defaultProvider: string;
  templates: {
    bookingConfirmation: string;
    paymentConfirmation: string;
    bookingReminder: string;
    seatTransfer: string;
  };
}

export function SmsSettings() {
  const [settings, setSettings] = useState<SmsSettings>({
    twilio: {
      enabled: true,
      accountSid: '',
      authToken: '',
      fromNumber: ''
    },
    msg91: {
      enabled: false,
      authKey: '',
      senderId: '',
      route: '4'
    },
    textlocal: {
      enabled: false,
      apiKey: '',
      sender: ''
    },
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
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('smsSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      localStorage.setItem('smsSettings', JSON.stringify(settings));
      toast({
        title: "Settings saved",
        description: "SMS settings have been updated successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SMS settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestSms = async () => {
    if (!testNumber) {
      toast({
        title: "Error",
        description: "Please enter a test phone number.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate sending test SMS
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast({
        title: "Test SMS sent",
        description: `Test SMS sent successfully to ${testNumber}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test SMS.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProviderSettings = (provider: keyof Omit<SmsSettings, 'defaultProvider' | 'templates'>, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const updateTemplate = (template: keyof SmsSettings['templates'], value: string) => {
    setSettings(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [template]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SMS Provider Configuration</CardTitle>
          <CardDescription>
            Configure SMS providers for sending notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Twilio Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Twilio</h3>
                <p className="text-sm text-muted-foreground">Configure Twilio SMS service</p>
              </div>
              <Switch
                checked={settings.twilio.enabled}
                onCheckedChange={(enabled) => updateProviderSettings('twilio', 'enabled', enabled)}
              />
            </div>
            
            {settings.twilio.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twilio-account-sid">Account SID</Label>
                  <Input
                    id="twilio-account-sid"
                    value={settings.twilio.accountSid}
                    onChange={(e) => updateProviderSettings('twilio', 'accountSid', e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twilio-auth-token">Auth Token</Label>
                  <Input
                    id="twilio-auth-token"
                    type="password"
                    value={settings.twilio.authToken}
                    onChange={(e) => updateProviderSettings('twilio', 'authToken', e.target.value)}
                    placeholder="Enter your auth token"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="twilio-from-number">From Number</Label>
                  <Input
                    id="twilio-from-number"
                    value={settings.twilio.fromNumber}
                    onChange={(e) => updateProviderSettings('twilio', 'fromNumber', e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
            )}
          </div>

          {/* MSG91 Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">MSG91</h3>
                <p className="text-sm text-muted-foreground">Configure MSG91 SMS service</p>
              </div>
              <Switch
                checked={settings.msg91.enabled}
                onCheckedChange={(enabled) => updateProviderSettings('msg91', 'enabled', enabled)}
              />
            </div>
            
            {settings.msg91.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="msg91-auth-key">Auth Key</Label>
                  <Input
                    id="msg91-auth-key"
                    type="password"
                    value={settings.msg91.authKey}
                    onChange={(e) => updateProviderSettings('msg91', 'authKey', e.target.value)}
                    placeholder="Enter your MSG91 auth key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="msg91-sender-id">Sender ID</Label>
                  <Input
                    id="msg91-sender-id"
                    value={settings.msg91.senderId}
                    onChange={(e) => updateProviderSettings('msg91', 'senderId', e.target.value)}
                    placeholder="INHALE"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="msg91-route">Route</Label>
                  <Select 
                    value={settings.msg91.route} 
                    onValueChange={(value) => updateProviderSettings('msg91', 'route', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select route" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Promotional</SelectItem>
                      <SelectItem value="4">Transactional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* TextLocal Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">TextLocal</h3>
                <p className="text-sm text-muted-foreground">Configure TextLocal SMS service</p>
              </div>
              <Switch
                checked={settings.textlocal.enabled}
                onCheckedChange={(enabled) => updateProviderSettings('textlocal', 'enabled', enabled)}
              />
            </div>
            
            {settings.textlocal.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="textlocal-api-key">API Key</Label>
                  <Input
                    id="textlocal-api-key"
                    type="password"
                    value={settings.textlocal.apiKey}
                    onChange={(e) => updateProviderSettings('textlocal', 'apiKey', e.target.value)}
                    placeholder="Enter your TextLocal API key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="textlocal-sender">Sender</Label>
                  <Input
                    id="textlocal-sender"
                    value={settings.textlocal.sender}
                    onChange={(e) => updateProviderSettings('textlocal', 'sender', e.target.value)}
                    placeholder="INHALE"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Default Provider */}
          <div className="space-y-2">
            <Label htmlFor="default-sms-provider">Default SMS Provider</Label>
            <Select value={settings.defaultProvider} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultProvider: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select default SMS provider" />
              </SelectTrigger>
              <SelectContent>
                {settings.twilio.enabled && <SelectItem value="twilio">Twilio</SelectItem>}
                {settings.msg91.enabled && <SelectItem value="msg91">MSG91</SelectItem>}
                {settings.textlocal.enabled && <SelectItem value="textlocal">TextLocal</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Test SMS */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-lg font-medium">Test SMS Configuration</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter test phone number (+91xxxxxxxxxx)"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                className="flex-1"
              />
              <Button onClick={sendTestSms} disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Test SMS"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMS Templates */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Templates</CardTitle>
          <CardDescription>
            Customize SMS templates for different notifications. Use variables like {'{bookingId}'}, {'{seatNumber}'}, {'{cabinName}'}, {'{amount}'}, {'{expiryDate}'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-confirmation-sms">Booking Confirmation</Label>
            <Textarea
              id="booking-confirmation-sms"
              value={settings.templates.bookingConfirmation}
              onChange={(e) => updateTemplate('bookingConfirmation', e.target.value)}
              placeholder="Enter booking confirmation SMS template"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payment-confirmation-sms">Payment Confirmation</Label>
            <Textarea
              id="payment-confirmation-sms"
              value={settings.templates.paymentConfirmation}
              onChange={(e) => updateTemplate('paymentConfirmation', e.target.value)}
              placeholder="Enter payment confirmation SMS template"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="booking-reminder-sms">Booking Reminder</Label>
            <Textarea
              id="booking-reminder-sms"
              value={settings.templates.bookingReminder}
              onChange={(e) => updateTemplate('bookingReminder', e.target.value)}
              placeholder="Enter booking reminder SMS template"
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seat-transfer-sms">Seat Transfer</Label>
            <Textarea
              id="seat-transfer-sms"
              value={settings.templates.seatTransfer}
              onChange={(e) => updateTemplate('seatTransfer', e.target.value)}
              placeholder="Enter seat transfer SMS template"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save SMS Settings"}
        </Button>
      </div>
    </div>
  );
}
