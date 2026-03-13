import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Building2, Wallet, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import PartnerMoreMenu from './PartnerMoreMenu';

const tabs = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/partner/dashboard',
    isActive: (p: string) => p === '/partner' || p === '/partner/dashboard',
  },
  {
    label: 'Bookings',
    icon: BookOpen,
    to: '/partner/bookings',
    isActive: (p: string) => p.startsWith('/partner/bookings') || p.startsWith('/partner/hostel-bookings'),
  },
  {
    label: 'Properties',
    icon: Building2,
    to: '/partner/manage-properties',
    isActive: (p: string) =>
      p.startsWith('/partner/manage-properties') ||
      p.startsWith('/partner/rooms') ||
      p.startsWith('/partner/hostels') ||
      p.startsWith('/partner/cabins'),
  },
  {
    label: 'Earnings',
    icon: Wallet,
    to: '/partner/earnings',
    isActive: (p: string) =>
      p.startsWith('/partner/earnings') ||
      p.startsWith('/partner/vendorpayouts') ||
      p.startsWith('/partner/receipts') ||
      p.startsWith('/partner/reconciliation'),
  },
];

export const PartnerBottomNav: React.FC = () => {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Check if current page is one of the "more" pages (not covered by main tabs)
  const isMoreActive = !tabs.some(tab => tab.isActive(pathname)) && pathname.startsWith('/partner');

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch max-w-lg mx-auto">
          {tabs.map((tab) => {
            const active = tab.isActive(pathname);
            return (
              <Link
                key={tab.label}
                to={tab.to}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] relative transition-all duration-200 overflow-hidden',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-primary" />
                )}
                <div className={cn(
                  'w-full flex flex-col items-center gap-0.5 px-0.5 py-1 rounded-xl transition-all duration-200 overflow-hidden',
                  active && 'bg-primary/10'
                )}>
                  <tab.icon
                    className="w-5 h-5"
                    strokeWidth={active ? 2.5 : 1.75}
                  />
                  <span className={cn('text-[9px] leading-tight whitespace-nowrap', active ? 'font-semibold' : 'font-medium')}>
                    {tab.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] relative transition-all duration-200 overflow-hidden',
              isMoreActive || moreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isMoreActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-primary" />
            )}
            <div className={cn(
              'w-full flex flex-col items-center gap-0.5 px-0.5 py-1 rounded-xl transition-all duration-200 overflow-hidden',
              (isMoreActive || moreOpen) && 'bg-primary/10'
            )}>
              <MoreHorizontal
                className="w-5 h-5"
                strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.75}
              />
              <span className={cn('text-[9px] leading-tight whitespace-nowrap', isMoreActive || moreOpen ? 'font-semibold' : 'font-medium')}>
                More
              </span>
            </div>
          </button>
        </div>
      </nav>

      <PartnerMoreMenu open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
};

export default PartnerBottomNav;
