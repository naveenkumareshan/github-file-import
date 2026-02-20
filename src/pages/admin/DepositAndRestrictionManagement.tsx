
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DepositManagement } from '@/components/admin/DepositManagement';
import { Wallet, Ban } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RefundManagement } from '@/components/admin/RefundManagement';

const DepositAndRestrictionManagement = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab') as 'deposits' | 'refunds' | 'refunded' | null;
    const [activeTab, setActiveTab] = useState<'deposits' | 'refunds' | 'refunded'>(
      tabFromUrl || 'deposits'
    );
    // Update URL when tab changes
  const handleTabChange = (value: string) => {
     const newTab = value as 'deposits' | 'refunds' | 'refunded';
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Deposit & Refunds  Management</h1>
        <p className="text-muted-foreground">
          Manage key deposit refunds
        </p>
      </div>
      <Tabs value={activeTab} className="space-y-6" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deposits" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
            Deposits
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
            Refund Management
          </TabsTrigger>
          <TabsTrigger value="refunded" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Refunded
          </TabsTrigger>
          {/* <TabsTrigger value="restrictions" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Room Restrictions
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value="deposits">
          <DepositManagement type={'Deposits'} />
        </TabsContent>
        <TabsContent value="refunds">
          <RefundManagement type={'Refunds'} status={'pending'}/>
        </TabsContent>
        <TabsContent value="refunded">
          <RefundManagement type={'Refunded'} status={'refunded'}/>
        </TabsContent>
        {/* <TabsContent value="restrictions">
          <RoomRestrictionManagement />
        </TabsContent> */}
      </Tabs>
    </div>
  );
};

export default DepositAndRestrictionManagement;
