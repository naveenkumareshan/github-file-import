
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { settingsService } from '@/api/settingsService';
import { Save, Loader2, Send } from 'lucide-react';

interface EmailSettingsType {
  smtp: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };
  mailgun: {
    enabled: boolean;
    apiKey: string;
    domain: string;
    fromEmail: string;
    fromName: string;
  };
  sendgrid: {
    enabled: boolean;
    apiKey: string;
    fromEmail: string;
    fromName: string;
  };
  defaultProvider: string;
}

export function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettingsType>({
    smtp: { enabled: true, host: '', port: 587, secure: false, username: '', password: '', fromEmail: '', fromName: 'InhaleStays' },
    mailgun: { enabled: false, apiKey: '', domain: '', fromEmail: '', fromName: 'InhaleStays' },
    sendgrid: { enabled: false, apiKey: '', fromEmail: '', fromName: 'InhaleStays' },
    defaultProvider: 'smtp',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await settingsService.getSettings('email');
      if (response.success && response.data.length > 0) {
        const emailSettings = response.data.reduce((acc: any, setting: any) => {
          if (setting.provider === 'default') {
            acc.defaultProvider = setting.settings.provider || 'smtp';
          } else if (setting.provider && setting.provider !== 'default' && setting.provider !== 'templates') {
            acc[setting.provider] = setting.settings;
          }
          return acc;
        }, {});
        setSettings(prev => ({ ...prev, ...emailSettings }));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load email settings.', variant: 'destructive' });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      for (const [provider, config] of Object.entries(settings)) {
        if (provider !== 'defaultProvider') {
          await settingsService.saveSettings({ category: 'email', provider, settings: config, isActive: true });
        }
      }
      await settingsService.saveSettings({ category: 'email', provider: 'default', settings: { provider: settings.defaultProvider }, isActive: true });
      toast({ title: 'Saved', description: 'Email settings updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save email settings.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({ title: 'Error', description: 'Please enter a test email address.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await settingsService.testEmailSettings(settings.defaultProvider, settings[settings.defaultProvider as keyof Omit<EmailSettingsType, 'defaultProvider'>], testEmail);
      toast({ title: 'Sent', description: `Test email sent to ${testEmail}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to send test email.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProviderSettings = (provider: keyof Omit<EmailSettingsType, 'defaultProvider'>, field: string, value: any) => {
    setSettings(prev => ({ ...prev, [provider]: { ...prev[provider], [field]: value } }));
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
      {/* SMTP */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">SMTP Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-xs font-medium">Enable SMTP</p>
              <p className="text-[11px] text-muted-foreground">Send emails via custom SMTP server</p>
            </div>
            <Switch checked={settings.smtp.enabled} onCheckedChange={(v) => updateProviderSettings('smtp', 'enabled', v)} className="scale-90" />
          </div>

          {settings.smtp.enabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">SMTP Host</Label>
                  <Input value={settings.smtp.host} onChange={(e) => updateProviderSettings('smtp', 'host', e.target.value)} placeholder="smtp.gmail.com" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Port</Label>
                  <Input type="number" value={settings.smtp.port} onChange={(e) => updateProviderSettings('smtp', 'port', parseInt(e.target.value))} className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Username</Label>
                  <Input value={settings.smtp.username} onChange={(e) => updateProviderSettings('smtp', 'username', e.target.value)} placeholder="your-email@gmail.com" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Password</Label>
                  <Input type="password" value={settings.smtp.password} onChange={(e) => updateProviderSettings('smtp', 'password', e.target.value)} placeholder="App password" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">From Email</Label>
                  <Input value={settings.smtp.fromEmail} onChange={(e) => updateProviderSettings('smtp', 'fromEmail', e.target.value)} placeholder="noreply@yourcompany.com" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">From Name</Label>
                  <Input value={settings.smtp.fromName} onChange={(e) => updateProviderSettings('smtp', 'fromName', e.target.value)} placeholder="InhaleStays" className="h-8 text-xs" />
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium">Use SSL/TLS</p>
                  <p className="text-[11px] text-muted-foreground">Secure connection</p>
                </div>
                <Switch checked={settings.smtp.secure} onCheckedChange={(v) => updateProviderSettings('smtp', 'secure', v)} className="scale-90" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Provider & Test */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Provider & Testing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Default Email Provider</Label>
            <Select value={settings.defaultProvider} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultProvider: value }))}>
              <SelectTrigger className="h-8 text-xs max-w-xs">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {settings.smtp.enabled && <SelectItem value="smtp">SMTP</SelectItem>}
                {settings.mailgun.enabled && <SelectItem value="mailgun">Mailgun</SelectItem>}
                {settings.sendgrid.enabled && <SelectItem value="sendgrid">SendGrid</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border">
            <Label className="text-xs">Send Test Email</Label>
            <div className="flex gap-2">
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="h-8 text-xs flex-1 max-w-xs"
              />
              <Button size="sm" variant="outline" onClick={sendTestEmail} disabled={isLoading || !testEmail} className="h-8 text-[11px] gap-1 px-2.5">
                <Send className="h-3 w-3" />
                Send
              </Button>
            </div>
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
