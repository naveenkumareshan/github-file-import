import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CheckInTracker from '@/components/admin/operations/CheckInTracker';
import ComplaintTracker from '@/components/admin/operations/ComplaintTracker';
import QrCodesTab from '@/components/admin/operations/QrCodesTab';
import CashHandoverTab from '@/components/admin/operations/CashHandoverTab';
import AttendancePinDisplay from '@/components/admin/AttendancePinDisplay';
import { ClipboardCheck, MessageSquare, QrCode, Handshake } from 'lucide-react';

const OperationsHub = () => {
  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Operations</h1>
          <p className="text-sm text-muted-foreground">Check-in tracking, complaints & cash handover</p>
        </div>
        <AttendancePinDisplay />
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
          <TabsTrigger value="cashhandover" className="gap-1.5">
            <Handshake className="h-3.5 w-3.5" />
            Cash Handover
          </TabsTrigger>
          <TabsTrigger value="qrcodes" className="gap-1.5">
            <QrCode className="h-3.5 w-3.5" />
            QR Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkin">
          <CheckInTracker />
        </TabsContent>
        <TabsContent value="complaints">
          <ComplaintTracker />
        </TabsContent>
        <TabsContent value="cashhandover">
          <CashHandoverTab />
        </TabsContent>
        <TabsContent value="qrcodes">
          <QrCodesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationsHub;
