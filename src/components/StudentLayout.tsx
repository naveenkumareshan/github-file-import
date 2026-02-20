
import React, { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

// StudentLayout now delegates to MobileAppLayout (used for the /student/* sub-routes)
// The actual layout is handled at the App.tsx route level via MobileAppLayout.
// This file is kept for any remaining legacy imports.
const MobileAppLayout = lazy(() => import('./student/MobileAppLayout'));

const StudentLayout: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <MobileAppLayout />
    </Suspense>
  );
};

export default StudentLayout;
