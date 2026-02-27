import React from 'react';
import { Outlet } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';

const MobileAppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background no-scrollbar">
      <main className="flex-1 pb-16 no-scrollbar">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default MobileAppLayout;
