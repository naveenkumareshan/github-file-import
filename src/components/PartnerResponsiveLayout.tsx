import React, { lazy, Suspense } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2 } from 'lucide-react';

const AdminLayout = lazy(() => import('./AdminLayout'));
const PartnerMobileLayout = lazy(() => import('./partner/PartnerMobileLayout'));

/**
 * Responsive wrapper for partner routes:
 * - Mobile → PartnerMobileLayout (bottom nav)
 * - Desktop → AdminLayout (sidebar)
 */
const PartnerResponsiveLayout: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
      {isMobile ? <PartnerMobileLayout /> : <AdminLayout />}
    </Suspense>
  );
};

export default PartnerResponsiveLayout;
