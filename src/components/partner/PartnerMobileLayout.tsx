import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { PartnerBottomNav } from './PartnerBottomNav';

const PartnerMobileLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-16 no-scrollbar">
        <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
          <Outlet />
        </Suspense>
      </main>
      <PartnerBottomNav />
    </div>
  );
};

export default PartnerMobileLayout;
