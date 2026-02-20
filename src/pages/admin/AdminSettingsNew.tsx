
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteSettingsForm } from '@/components/admin/SiteSettingsForm';
import { PaymentGatewaySettings } from '@/components/admin/settings/PaymentGatewaySettings';
import { EmailSettings } from '@/components/admin/settings/EmailSettings';
import { SmsSettings } from '@/components/admin/settings/SmsSettings';

export default function AdminSettingsNew() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">System Configuration</h1>
        <p className="text-muted-foreground">Manage site settings and integrations</p>
      </div>
      
      <Tabs defaultValue="site" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="site">Site Settings</TabsTrigger>
          <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
          <TabsTrigger value="email">Email Configuration</TabsTrigger>
          <TabsTrigger value="sms">SMS Configuration</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
