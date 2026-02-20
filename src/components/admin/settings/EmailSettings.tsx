
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { settingsService } from '@/api/settingsService';

interface EmailSettings {
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
  templates: {
    bookingConfirmation: string;
    paymentConfirmation: string;
    bookingCancellation: string;
    seatTransfer: string;
  };
}

export function EmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    smtp: {
      enabled: true,
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromEmail: '',
      fromName: 'InhaleStays'
    },
    mailgun: {
      enabled: false,
      apiKey: '',
      domain: '',
      fromEmail: '',
      fromName: 'InhaleStays'
    },
    sendgrid: {
      enabled: false,
      apiKey: '',
      fromEmail: '',
      fromName: 'InhaleStays'
    },
    defaultProvider: 'smtp',
    templates: {
      bookingConfirmation: 'Your booking has been confirmed successfully.',
      paymentConfirmation: 'Payment received successfully for your booking.',
      bookingCancellation: 'Your booking has been cancelled.',
      seatTransfer: 'Your seat has been transferred successfully.'
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await settingsService.getSettings('email');
      if (response.success && response.data.length > 0) {
        const emailSettings = response.data.reduce((acc: any, setting: any) => {
          if (setting.provider === 'default') {
            acc.defaultProvider = setting.settings.provider || 'smtp';
          } else if (setting.provider === 'templates') {
            acc.templates = { ...acc.templates, ...setting.settings };
          } else if (setting.provider && setting.provider !== 'default' && setting.provider !== 'templates') {
            acc[setting.provider] = setting.settings;
          }
          return acc;
        }, { templates: settings.templates });
        
        setSettings(prev => ({
          ...prev,
          ...emailSettings
        }));
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
      toast({
        title: "Error",
        description: "Failed to load email settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save each provider settings
      for (const [provider, config] of Object.entries(settings)) {
        if (provider !== 'defaultProvider' && provider !== 'templates') {
          await settingsService.saveSettings({
            category: 'email',
            provider,
            settings: config,
            isActive: true
          });
        }
      }
      
      // Save default provider
      await settingsService.saveSettings({
        category: 'email',
        provider: 'default',
        settings: { provider: settings.defaultProvider },
        isActive: true
      });

      // Save templates
      await settingsService.saveSettings({
        category: 'email',
        provider: 'templates',
        settings: settings.templates,
        isActive: true
      });

      toast({
        title: "Settings saved",
        description: "Email settings have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast({
        title: "Error",
        description: "Failed to save email settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await settingsService.testEmailSettings(settings.defaultProvider, settings[settings.defaultProvider as keyof Omit<EmailSettings, 'defaultProvider' | 'templates'>], testEmail);
      toast({
        title: "Test email sent",
        description: `Test email sent successfully to ${testEmail}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test email.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProviderSettings = (provider: keyof Omit<EmailSettings, 'defaultProvider' | 'templates'>, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const updateTemplate = (template: keyof EmailSettings['templates'], value: string) => {
    setSettings(prev => ({
      ...prev,
      templates: {
        ...prev.templates,
        [template]: value
      }
    }));
  };

  if (isLoadingSettings) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Provider Configuration</CardTitle>
          <CardDescription>
            Configure email providers for sending notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* SMTP Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">SMTP Configuration</h3>
                <p className="text-sm text-muted-foreground">Configure custom SMTP server</p>
              </div>
              <Switch
                checked={settings.smtp.enabled}
                onCheckedChange={(enabled) => updateProviderSettings('smtp', 'enabled', enabled)}
              />
            </div>
            
            {settings.smtp.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    value={settings.smtp.host}
                    onChange={(e) => updateProviderSettings('smtp', 'host', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    value={settings.smtp.port}
                    onChange={(e) => updateProviderSettings('smtp', 'port', parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-username">Username</Label>
                  <Input
                    id="smtp-username"
                    value={settings.smtp.username}
                    onChange={(e) => updateProviderSettings('smtp', 'username', e.target.value)}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <Input
                    id="smtp-password"
                    type="password"
                    value={settings.smtp.password}
                    onChange={(e) => updateProviderSettings('smtp', 'password', e.target.value)}
                    placeholder="Your app password"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-email">From Email</Label>
                  <Input
                    id="smtp-from-email"
                    value={settings.smtp.fromEmail}
                    onChange={(e) => updateProviderSettings('smtp', 'fromEmail', e.target.value)}
                    placeholder="noreply@yourcompany.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-name">From Name</Label>
                  <Input
                    id="smtp-from-name"
                    value={settings.smtp.fromName}
                    onChange={(e) => updateProviderSettings('smtp', 'fromName', e.target.value)}
                    placeholder="InhaleStays"
                  />
                </div>
                
                <div className="flex items-center space-x-2 col-span-2">
                  <Switch
                    id="smtp-secure"
                    checked={settings.smtp.secure}
                    onCheckedChange={(secure) => updateProviderSettings('smtp', 'secure', secure)}
                  />
                  <Label htmlFor="smtp-secure">Use SSL/TLS</Label>
                </div>
              </div>
            )}
          </div>

          {/* Default Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="default-provider">Default Email Provider</Label>
            <Select value={settings.defaultProvider} onValueChange={(value) => setSettings(prev => ({ ...prev, defaultProvider: value }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select default provider" />
              </SelectTrigger>
              <SelectContent>
                {settings.smtp.enabled && <SelectItem value="smtp">SMTP</SelectItem>}
                {settings.mailgun.enabled && <SelectItem value="mailgun">Mailgun</SelectItem>}
                {settings.sendgrid.enabled && <SelectItem value="sendgrid">SendGrid</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Test Email */}
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email</Label>
            <div className="flex gap-2">
              <Input
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="flex-1"
              />
              <Button onClick={sendTestEmail} disabled={isLoading || !testEmail}>
                {isLoading ? "Sending..." : "Send Test"}
              </Button>
            </div>
          </div>
          
          <div className="mt-6">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Email Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
