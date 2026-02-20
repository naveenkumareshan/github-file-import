import React, { lazy, Suspense } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { MobileBottomNav } from './MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import inhalestaysLogo from '@/assets/inhalestays-logo.png';

const ChatbotButton = lazy(() => import('@/components/JiyaChatbot/ChatbotButton'));

const MobileAppLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Thin top header */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border h-14 flex items-center px-4"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between w-full max-w-lg mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <img src={inhalestaysLogo} alt="InhaleStays" className="w-8 h-8 object-contain" />
            <span className="font-bold text-base text-foreground tracking-tight">InhaleStays</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/student/profile">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link
                to="/student/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable content: pt-14 for top header + pb-16 for bottom nav */}
      <main className="flex-1 pt-14 pb-16">
        <Outlet />
      </main>

      {/* Chatbot floats above the bottom nav */}
      <Suspense fallback={null}>
        <ChatbotButton />
      </Suspense>

      <MobileBottomNav />
    </div>
  );
};

export default MobileAppLayout;
