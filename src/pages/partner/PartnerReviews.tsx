import React, { lazy, Suspense, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Building, Hotel } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const ReviewsManagement = lazy(() => import('@/pages/admin/ReviewsManagement'));

const PartnerReviews: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reading_room');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-primary" />
        <h1 className="text-base font-semibold">Reviews</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
        <TabsList className="h-8">
          <TabsTrigger value="reading_room" className="text-xs gap-1.5">
            <Building className="h-3.5 w-3.5" />
            Reading Rooms
          </TabsTrigger>
          <TabsTrigger value="hostel" className="text-xs gap-1.5">
            <Hotel className="h-3.5 w-3.5" />
            Hostels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reading_room">
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
            <ReviewsManagement />
          </Suspense>
        </TabsContent>

        <TabsContent value="hostel">
          <Suspense fallback={<div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
            <ReviewsManagement />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnerReviews;
