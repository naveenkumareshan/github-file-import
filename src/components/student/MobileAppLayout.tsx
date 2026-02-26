import React from 'react';
import { Outlet } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';

const MobileAppLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default MobileAppLayout;
