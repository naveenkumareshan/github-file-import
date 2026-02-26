
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useVendorEmployeePermissions } from '@/hooks/useVendorEmployeePermissions';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  Building, 
  Users, 
  Plus,
  Settings, 
  Bed,
  MapPin,
  CreditCard,
  Mail,
  MessageSquare,
  LogOut,
  TicketPercent,
  Import,
  User,
  Currency,
  Users2,
  Wallet,
  Map,
  Bell,
  MapIcon,
  TicketPlus,
  Hotel,
  HomeIcon,
  Star,
  BarChart2,
  ArrowLeftRight,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"

interface MenuItem {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  roles: string[];
  permissions?: string[];
  subItems?: MenuItem[];
}

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission, hasAnyPermission, loading } = useVendorEmployeePermissions();

  if (loading) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      url: '/admin/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'vendor', 'vendor_employee'],
      permissions: ['view_dashboard']
    }
  ];

  if (user?.role === 'admin' || hasPermission('seats_available_map')) {
    menuItems.push({
      title: 'Seat Map',
      url: '/admin/seats-available-map',
      icon: MapIcon,
      roles: ['admin', 'vendor', 'vendor_employee'],
      permissions: ['seats_available_map']
    });
  }

  if (user?.role === 'admin' || hasPermission('view_bookings')) {
    menuItems.push({
      title: 'Due Management',
      url: '/admin/due-management',
      icon: Wallet,
      roles: ['admin', 'vendor', 'vendor_employee'],
      permissions: ['view_bookings']
    });
  }

  if (user?.role === 'admin' || hasPermission('view_bookings')) {
    const bookingSubItems = [];
    
    if (user?.role === 'admin' || hasPermission('view_bookings')) {
      bookingSubItems.push({
        title: 'All Transactions',
        url: '/admin/bookings',
        icon: Calendar,
        roles: ['admin', 'vendor', 'vendor_employee'],
        permissions: ['view_bookings']
      });
      bookingSubItems.push({
        title: 'Receipts',
        url: '/admin/receipts',
        icon: CreditCard,
        roles: ['admin', 'vendor', 'vendor_employee'],
        permissions: ['view_bookings']
      });
    }
    
    if (user?.role === 'admin' || user?.role=='vendor') {
      bookingSubItems.push(
        {
          title: 'Transfer Seat',
          url: '/admin/seat-transfer',
          icon: ArrowLeftRight,
          roles: ['admin','vendor']
        },
        {
          title: 'Manual Booking',
          url: '/admin/manual-bookings',
          icon: BookOpen,
          roles: ['admin','vendor']
        },
        {
          title: 'Key Deposits',
          url: '/admin/deposits-restrictions',
          icon: Wallet,
          roles: ['admin','vendor']
        }
      );
    }

    if (bookingSubItems.length > 0) {
      menuItems.push({
        title: 'Bookings',
        icon: Calendar,
        roles: ['admin', 'vendor', 'vendor_employee'],
        permissions: ['view_bookings'],
        subItems: bookingSubItems,
      });
    }
  }

  if (user?.role === 'admin' ||  hasPermission('manage_students')) {
    menuItems.push({
      title: 'Users',
      icon: Users,
      roles: ['admin', 'vendor', 'vendor_employee'],
      subItems: [
        { title: 'All Users', url: '/admin/students', icon: Users, roles: ['admin', 'vendor', 'vendor_employee'] },
        { title: 'Create User', url: '/admin/students-create', icon: Plus, roles: ['admin','vendor'] },
        { title: 'Import Users', url: '/admin/students-import', icon: Import, roles: ['admin','vendor'] },
        {
          title: 'Coupons',
          url: '/admin/coupons',
          icon: TicketPlus,
          roles: ['admin', 'vendor', 'vendor_employee']
        },
      ],
    });
  }

  if ((user?.role === 'admin' || hasPermission('view_reading_rooms') && import.meta.env.VITE_HOSTEL_MODULE)) {
    menuItems.push({
      title: 'Hostels',
      icon: Hotel,
      roles: ['admin', 'vendor', 'vendor_employee'],
      permissions: ['view_reading_rooms'],
      subItems: [
        {
          title: 'Manage Hostels',
          url: '/admin/hostels',
          icon: HomeIcon,
          roles: ['admin', 'vendor', 'vendor_employee'],
          permissions: ['view_reading_rooms']
        },
        {
          title: 'Reviews',
          url: '/admin/reviews?module=Hostel',
          icon: Star,
          roles: ['admin', 'vendor', 'vendor_employee'],
          permissions: ['manage_reviews']
        }
      ],
    });
  }

  if (user?.role === 'admin' || hasPermission('view_reading_rooms')) {
    menuItems.push({
      title: 'Reading Rooms',
      icon: Building,
      roles: ['admin', 'vendor', 'vendor_employee'],
      permissions: ['view_reading_rooms'],
      subItems: [
        {
          title: 'Manage Rooms',
          url: '/admin/rooms',
          icon: Building,
          roles: ['admin', 'vendor', 'vendor_employee'],
          permissions: ['view_reading_rooms']
        },
        {
          title: 'Reviews',
          url: '/admin/reviews?module=Reading Room',
          icon: Star,
          roles: ['admin', 'vendor', 'vendor_employee'],
          permissions: ['manage_reviews']
        }
      ],
    });
  }

  if (user?.role === 'admin') {
    menuItems.push(
      {
        title: 'Settings',
        icon: Settings,
        roles: ['admin'],
        subItems: [
          { title: 'Site Configuration', url: '/admin/settings', icon: Settings, roles: ['admin'] }
        ],
      },
      {
      title: 'Partners',
      url: '/admin/vendors',
      icon: UserCheck,
      roles: ['admin']
      },
      {
        title: 'Reports',
        icon: BarChart2,
        roles: ['admin'],
        subItems: [
          { title: 'Booking Reports', url: '/admin/reports', icon: BarChart2, roles: ['admin'] },
          { title: 'Payouts', url: '/admin/payouts', icon: Wallet, roles: ['admin'] }
        ],
      },
      {
        title: 'Messaging',
        icon: Mail,
        roles: ['admin'],
        subItems: [
          { title: 'Email Reports', url: '/admin/email-reports', icon: Mail, roles: ['admin'] },
          { title: 'Email Templates', url: '/admin/email-templates', icon: MessageSquare, roles: ['admin'] }
        ],
      },
      {
        title: 'Locations',
        icon: Map,
        roles: ['admin'],
        url: '/admin/locations'
      },
      {
        title: 'Banners',
        icon: Bell,
        roles: ['admin'],
        url: '/admin/banners'
      },
      {
        title: 'Complaints',
        icon: MessageSquare,
        roles: ['admin'],
        url: '/admin/complaints'
      },
      {
        title: 'Support Tickets',
        icon: Mail,
        roles: ['admin'],
        url: '/admin/support-tickets'
      }
    );
  } else {
    const vendorMenuItems = [];

    if (hasPermission('view_reports')) {
      vendorMenuItems.push({
        title: 'Reports',
        icon: BarChart2,
        roles: ['vendor', 'vendor_employee'],
        permissions: ['view_reports'],
        subItems: [
          {
            title: 'Booking Reports',
            url: '/admin/reports',
            icon: BarChart2,
            roles: ['vendor', 'vendor_employee'],
            permissions: ['view_reports']
          }
        ],
      });
    }

    if (user?.role === 'vendor' || hasPermission('manage_employees')) {
      vendorMenuItems.push({
        title: 'Employees',
        icon: Users2,
        roles: ['vendor', 'vendor_employee'],
        permissions: ['manage_employees'],
        subItems: [
          {
            title: 'All Employees',
            url: '/admin/employees',
            icon: Users,
            roles: ['vendor', 'vendor_employee'],
            permissions: ['manage_employees']
          }
        ],
      });
    }

    if (hasPermission('view_payouts')) {
      vendorMenuItems.push({
        title: 'Payouts',
        icon: Wallet,
        roles: ['vendor', 'vendor_employee'],
        permissions: ['view_payouts'],
        url: '/admin/vendorpayouts'
      });
    }

    if (user?.role == 'vendor') {
      vendorMenuItems.push({
        title: 'Profile',
        icon: User,
        roles: ['vendor', 'vendor_employee'],
        url: '/admin/profile'
      });
    }

    menuItems.push(...vendorMenuItems);
  }

  const isActiveItem = (itemUrl?: string, subItems?: MenuItem[]) => {
    if (itemUrl && pathname === itemUrl) return true;
    if (subItems) {
      return subItems.some(subItem => pathname === subItem.url);
    }
    return false;
  };

  const hasAccess = (item: MenuItem) => {
    if (!item.roles.includes(user?.role || '')) {
      return false;
    }
    if (item.permissions && user?.role === 'vendor_employee') {
      return hasAnyPermission(item.permissions as any);
    }
    return true;
  };

  const renderMenuItem = (item: MenuItem) => {
    if (!hasAccess(item)) {
      return null;
    }

    if (item.subItems) {
      const accessibleSubItems = item.subItems.filter(hasAccess);
      
      if (accessibleSubItems.length === 0) {
        return null;
      }

      return (
        <Collapsible key={item.title} defaultOpen={isActiveItem(item.url, item.subItems)}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className="w-full justify-between hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {accessibleSubItems.map((subItem) => {
                  const isActive = pathname === subItem.url || pathname.startsWith(subItem.url?.split('?')[0] || '____');
                  return (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive}
                        className={isActive ? "border-l-2 border-primary bg-primary/8 text-primary font-medium" : "hover:bg-muted/60"}
                      >
                        <Link to={subItem.url || '#'} className="flex items-center gap-2.5 pl-2">
                          <subItem.icon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs">{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    const isActive = pathname === item.url;
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={isActive ? "border-l-2 border-primary bg-primary/8 text-primary font-medium" : "hover:bg-muted/60 transition-colors"}
        >
          <Link to={item.url || '#'} className="flex items-center gap-2.5">
            <item.icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const getRoleBadgeStyle = () => {
    switch (user?.role) {
      case 'admin': return 'bg-blue-50 text-blue-700 border border-blue-200 ring-1 ring-blue-100';
      case 'vendor': return 'bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-100';
      case 'vendor_employee': return 'bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-100';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'admin': return 'Admin';
      case 'vendor': return 'Partner';
      case 'vendor_employee': return 'Employee';
      default: return 'User';
    }
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b" style={{ background: 'linear-gradient(180deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--background)) 100%)' }}>
        <div className="flex items-center gap-3 px-4 py-3.5">
          <img
            src="/src/assets/inhalestays-logo.png"
            alt="InhaleStays"
            className="h-8 w-8 rounded-lg object-contain drop-shadow-sm"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-semibold text-sm truncate tracking-tight">InhaleStays</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getRoleBadgeStyle()}`}>
                {getRoleLabel()}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">{user?.name}</span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <ScrollArea className="my-1">
                {menuItems.map(renderMenuItem).filter(Boolean)}
              </ScrollArea>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-red-50 hover:text-red-600 transition-colors" 
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2.5" />
              <span className="text-sm">Sign Out</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
