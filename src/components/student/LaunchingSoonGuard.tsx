import React from 'react';
import { useEnabledMenus, EnabledMenus } from '@/hooks/useEnabledMenus';
import { Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LaunchingSoonGuardProps {
  moduleKey: keyof EnabledMenus;
  children: React.ReactNode;
  moduleName?: string;
}

export function LaunchingSoonGuard({ moduleKey, children, moduleName }: LaunchingSoonGuardProps) {
  const { enabledMenus, loading } = useEnabledMenus();

  if (loading) return null;

  if (!enabledMenus[moduleKey]) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-sm w-full text-center border-dashed">
          <CardContent className="pt-8 pb-8 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Launching Soon</h2>
            <p className="text-sm text-muted-foreground">
              {moduleName || 'This feature'} is coming soon. Stay tuned for updates!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export default LaunchingSoonGuard;
