
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CheckInTracker from '@/components/admin/operations/CheckInTracker';
import ComplaintTracker from '@/components/admin/operations/ComplaintTracker';
import { ClipboardCheck, MessageSquare } from 'lucide-react';

const OperationsHub = () => {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Operations</h1>
        <p className="text-sm text-muted-foreground">Check-in tracking & complaint management</p>
      </div>

      <Tabs defaultValue="checkin" className="w-full">
        <TabsList>
          <TabsTrigger value="checkin" className="gap-1.5">
            <ClipboardCheck className="h-3.5 w-3.5" />
            Check-in
          </TabsTrigger>
          <TabsTrigger value="complaints" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Complaints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin">
          <CheckInTracker />
        </TabsContent>
        <TabsContent value="complaints">
          <ComplaintTracker />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationsHub;
