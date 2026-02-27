import React from 'react';
import { Outlet } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';

const MobileAppLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-16 no-scrollbar">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default MobileAppLayout;
