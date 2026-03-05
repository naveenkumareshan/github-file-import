import React, { lazy, Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Hotel, Plus, Shirt, Loader2, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePartnerPropertyTypes } from '@/hooks/usePartnerPropertyTypes';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const RoomManagement = lazy(() => import('@/pages/RoomManagement'));
const HostelManagement = lazy(() => import('@/pages/hotelManager/HostelManagement'));
const LaundryPartnerDashboard = lazy(() => import('@/pages/LaundryPartnerDashboard'));

const ManageProperties: React.FC = () => {
  const { hasReadingRooms, hasHostels, hasLaundry, loading } = usePartnerPropertyTypes();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [triggerNew, setTriggerNew] = useState(false);

  const hasAny = hasReadingRooms || hasHostels || hasLaundry;
  const showAllTabs = !hasAny && !loading;

  const defaultTab = hasReadingRooms ? 'rooms' : hasHostels ? 'hostels' : hasLaundry ? 'laundry' : 'rooms';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Get partner record
  const { data: partner } = useQuery({
    queryKey: ['partner-record', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('partners')
        .select('id, created_at')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  // Check universal subscription
  const { data: universalSub } = useQuery({
    queryKey: ['universal-sub', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return null;
      const { data } = await supabase
        .from('property_subscriptions')
        .select('id, status, end_date, subscription_plans(name, is_universal)')
        .eq('partner_id', partner.id)
        .eq('property_type', 'universal')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!partner?.id,
  });

  // Check any active subscription
  const { data: anySub } = useQuery({
    queryKey: ['any-active-sub', partner?.id],
    queryFn: async () => {
      if (!partner?.id) return null;
      const { data } = await supabase
        .from('property_subscriptions')
        .select('id, status')
        .eq('partner_id', partner.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!partner?.id && !universalSub,
  });

  // Get trial days config
  const { data: trialConfig } = useQuery({
    queryKey: ['platform-config', 'partner_trial_days'],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_config')
        .select('value')
        .eq('key', 'partner_trial_days')
        .maybeSingle();
      return data?.value as { days: number } | null;
    },
  });

  // Compute trial status
  const isInTrial = React.useMemo(() => {
    if (!partner?.created_at || !trialConfig) return false;
    const trialDays = trialConfig.days || 7;
    const created = new Date(partner.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= trialDays;
  }, [partner?.created_at, trialConfig]);

  const trialDaysRemaining = React.useMemo(() => {
    if (!partner?.created_at || !trialConfig) return 0;
    const trialDays = trialConfig.days || 7;
    const created = new Date(partner.created_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, trialDays - diffDays);
  }, [partner?.created_at, trialConfig]);

  // Update activeTab when loading finishes and defaultTab changes
  React.useEffect(() => {
    if (!loading) {
      setActiveTab(hasReadingRooms ? 'rooms' : hasHostels ? 'hostels' : hasLaundry ? 'laundry' : 'rooms');
    }
  }, [loading, hasReadingRooms, hasHostels, hasLaundry]);

  const handleAddProperty = (tab: string) => {
    // Check subscription gate
    if (universalSub) {
      toast({ title: 'Universal Package Active', description: 'No additional payment needed.' });
      proceedWithAdd(tab);
      return;
    }
    if (isInTrial) {
      toast({ title: 'Free Trial Active', description: `${trialDaysRemaining} day(s) remaining in your free trial.` });
      proceedWithAdd(tab);
      return;
    }
    if (anySub) {
      proceedWithAdd(tab);
      return;
    }
    // No subscription, no trial
    toast({ title: 'Subscription Required', description: 'Please subscribe to a plan before adding properties.', variant: 'destructive' });
    navigate('/partner/subscriptions');
  };

  const proceedWithAdd = (tab: string) => {
    setShowAddDialog(false);
    setActiveTab(tab);
    setTriggerNew(true);
  };

  // Reset triggerNew after it's been consumed
  const handleTriggerConsumed = () => setTriggerNew(false);

  const LoadingFallback = () => (
    <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold">Manage Properties</h1>
          {universalSub && (
            <Badge variant="outline" className="gap-1 text-xs border-primary text-primary">
              <ShieldCheck className="h-3 w-3" /> Universal
            </Badge>
          )}
          {!universalSub && isInTrial && (
            <Badge variant="outline" className="gap-1 text-xs border-amber-500 text-amber-600">
              <Clock className="h-3 w-3" /> Trial ({trialDaysRemaining}d left)
            </Badge>
          )}
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-3 w-3" /> Add New Property
        </Button>
      </div>

      {loading ? (
        <LoadingFallback />
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="h-8">
            {(showAllTabs || hasReadingRooms) && (
              <TabsTrigger value="rooms" className="text-xs gap-1.5">
                <Building className="h-3.5 w-3.5" />
                Reading Rooms
              </TabsTrigger>
            )}
            {(showAllTabs || hasHostels) && (
              <TabsTrigger value="hostels" className="text-xs gap-1.5">
                <Hotel className="h-3.5 w-3.5" />
                Hostels
              </TabsTrigger>
            )}
            {(showAllTabs || hasLaundry) && (
              <TabsTrigger value="laundry" className="text-xs gap-1.5">
                <Shirt className="h-3.5 w-3.5" />
                Laundry
              </TabsTrigger>
            )}
          </TabsList>

          {(showAllTabs || hasReadingRooms) && (
            <TabsContent value="rooms">
              <Suspense fallback={<LoadingFallback />}>
                <RoomManagement autoCreateNew={activeTab === 'rooms' && triggerNew} onTriggerConsumed={handleTriggerConsumed} />
              </Suspense>
            </TabsContent>
          )}

          {(showAllTabs || hasHostels) && (
            <TabsContent value="hostels">
              <Suspense fallback={<LoadingFallback />}>
                <HostelManagement autoCreateNew={activeTab === 'hostels' && triggerNew} onTriggerConsumed={handleTriggerConsumed} />
              </Suspense>
            </TabsContent>
          )}

          {(showAllTabs || hasLaundry) && (
            <TabsContent value="laundry">
              <Suspense fallback={<LoadingFallback />}>
                <LaundryPartnerDashboard />
              </Suspense>
            </TabsContent>
          )}
        </Tabs>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Select Property Type</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-start gap-2 h-12"
              onClick={() => handleAddProperty('rooms')}
            >
              <Building className="h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="text-sm font-medium">Reading Room</div>
                <div className="text-xs text-muted-foreground">Add a new reading room / library</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2 h-12"
              onClick={() => handleAddProperty('hostels')}
            >
              <Hotel className="h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="text-sm font-medium">Hostel</div>
                <div className="text-xs text-muted-foreground">Add a new hostel / PG</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start gap-2 h-12"
              onClick={() => handleAddProperty('laundry')}
            >
              <Shirt className="h-4 w-4 text-primary" />
              <div className="text-left">
                <div className="text-sm font-medium">Laundry</div>
                <div className="text-xs text-muted-foreground">Add a new laundry service</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageProperties;
