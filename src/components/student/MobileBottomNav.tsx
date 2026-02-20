import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Hotel, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const tabs = [
  {
    label: 'Home',
    icon: Home,
    to: '/',
    isActive: (pathname: string) => pathname === '/',
  },
  {
    label: 'Reading Rooms',
    icon: BookOpen,
    to: '/cabins',
    isActive: (pathname: string) =>
      pathname.startsWith('/cabins') || pathname.startsWith('/book-seat') || pathname.startsWith('/cabin'),
  },
  {
    label: 'Hostels',
    icon: Hotel,
    to: '/hostels',
    isActive: (pathname: string) => pathname.startsWith('/hostels') || pathname.startsWith('/hostel'),
  },
  {
    label: 'Profile',
    icon: User,
    to: '/student/profile',
    isActive: (pathname: string) => pathname.startsWith('/student'),
    requireAuth: true,
  },
];

export const MobileBottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          const href = tab.requireAuth && !isAuthenticated ? '/student/login' : tab.to;
          return (
            <Link
              key={tab.label}
              to={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[64px] text-xs font-medium transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon
                className={cn('w-6 h-6 transition-transform', active && 'scale-110')}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span className={cn('text-[11px] leading-tight', active && 'font-semibold')}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 block w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
