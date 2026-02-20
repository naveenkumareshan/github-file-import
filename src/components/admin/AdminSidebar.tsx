
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
  FileText, 
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
  Ban,
  Map,
  Bell,
  MapIcon,
  TicketPlus,
  Hotel,
  HomeIcon
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"
import { FcFeedback, FcHome, FcSettings } from 'react-icons/fc';

interface MenuItem {
  title: string;
  url?: string;
  icon: React.ComponentType<any>;
  roles: string[];
  permissions?: string[]; // New field for permission-based access
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
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
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

  // Add seat availability map for non-admin users with property permissions
  if (user?.role !== 'admin' && hasPermission('seats_available_map')) {
    menuItems.push({
      title: 'Seat Availability Map',
      url: '/admin/seats-available-map',
      icon: MapIcon,
      roles: ['vendor', 'vendor_employee'],
      permissions: ['seats_available_map']
    });
  }

  // Add deposits & restrictions section for admins only
  if (user?.role === 'admin' || user?.role == 'vendor') {
    menuItems.push({
      title: "Deposits & Restrictions",
      roles: ['admin','vendor'],
      icon: Wallet,
      subItems: [
        {
          title: "Key Deposits",
          url: "/admin/deposits-restrictions",
          icon: Wallet,
          roles: ['admin','vendor']
        }
      ]
    });
  }

  // Add reading rooms section with permission checks
  if ((user?.role === 'admin' || hasPermission('view_reading_rooms') && import.meta.env.VITE_HOSTEL_MODULE)) {
    menuItems.push({
      title: 'Hostels',
      icon: FcHome,
      roles: ['admin', 'vendor', 'vendor_employee'],
      permissions: ['view_reading_rooms'],
      subItems: [
        {
          title: 'Hostel Management',
          url: '/admin/hostels',
          icon: HomeIcon,
          roles: ['admin', 'vendor', 'vendor_employee'],
          permissions: ['view_reading_rooms']
        },
        {
          title: 'Reviews',
          url: '/admin/reviews?module=Hostel',
          icon: FcFeedback,
          roles: ['admin', 'vendor', 'vendor_employee'],
          permissions: ['manage_reviews']
        }
      ],
    });
  }

  // Add reading rooms section with permission checks
  if (user?.role === 'admin' || hasPermission('view_reading_rooms')) {
    menuItems.push({
      title: 'Reading Rooms',
      icon: Building,
      roles: ['admin', 'vendor', 'vendor_employee'],
      permissions: ['view_reading_rooms'],
      subItems: [
        {
          title: 'Room Management',
          url: '/admin/rooms',
          icon: Building,
          roles: ['admin', 'vendor', 'vendor_employee'],
          permissions: ['view_reading_rooms']
        },
        {
          title: 'Reviews',
          url: '/admin/reviews?module=Reading Room',
          icon: FcFeedback,
          roles: ['admin', 'vendor', 'vendor_employee'],
          permissions: ['manage_reviews']
        }
      ],
    });
  }

  // Add bookings section with permission checks
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
    }
    
    if (user?.role === 'admin' || user?.role=='vendor') {
      bookingSubItems.push(
        {
          title: 'Seat Transfer',
          url: '/admin/seat-transfer',
          icon: MapPin,
          roles: ['admin','vendor']
        },
        {
          title: 'Book Seat',
          url: '/admin/manual-bookings',
          icon: CreditCard,
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

  // Add user management section for admins only
  if (user?.role === 'admin' ||  hasPermission('manage_students')) {
    menuItems.push({
      title: 'User Management',
      icon: FileText,
      roles: ['admin', 'vendor', 'vendor_employee'],
      subItems: [
        { title: 'User', url: '/admin/students', icon: Users, roles: ['admin', 'vendor', 'vendor_employee'] },
        { title: 'Create Users', url: '/admin/students-create', icon: Plus, roles: ['admin','vendor'] },
        { title: 'Import Existing Users', url: '/admin/students-import', icon: Import, roles: ['admin','vendor'] },
        {
          title: 'Coupons',
          url: '/admin/coupons',
          icon: TicketPlus,
          roles: ['admin', 'vendor', 'vendor_employee']
        },
      ],
    });
  }

  // Role-specific menu items
  if (user?.role === 'admin') {
    menuItems.push(
      {
        title: 'Settings',
        icon: FcSettings,
        roles: ['admin'],
        subItems: [
          { title: 'Site Configuration', url: '/admin/settings', icon: Settings, roles: ['admin'] }
        ],
      },
      {
        title: 'Hosts',
        url: '/admin/vendors',
        icon: Users2,
        roles: ['admin']
      },
      {
        title: 'Reports',
        icon: FileText,
        roles: ['admin'],
        subItems: [
          { title: 'Booking Reports', url: '/admin/reports', icon: FileText, roles: ['admin'] },
          { title: 'Payouts', url: '/admin/payouts', icon: MessageSquare, roles: ['admin'] }
        ],
      },
      {
        title: 'Communication',
        icon: FileText,
        roles: ['admin'],
        subItems: [
          { title: 'Email Reports', url: '/admin/email-reports', icon: Mail, roles: ['admin'] },
          { title: 'Email Templates', url: '/admin/email-templates', icon: MessageSquare, roles: ['admin'] }
        ],
      },
      {
        title: 'Location Management',
        icon: Map,
        roles: ['admin'],
        url: '/admin/locations'
      }
    );
  } else {
    // Vendor/Vendor Employee specific items
    const vendorMenuItems = [];

    // Reports section with permission checks
    if (hasPermission('view_reports')) {
      vendorMenuItems.push({
        title: 'Reports',
        icon: FileText,
        roles: ['vendor', 'vendor_employee'],
        permissions: ['view_reports'],
        subItems: [
          {
            title: 'Booking Reports',
            url: '/admin/reports',
            icon: FileText,
            roles: ['vendor', 'vendor_employee'],
            permissions: ['view_reports']
          }
        ],
      });
    }

    // Employee management for vendors or employees with permission
    if (user?.role === 'vendor' || hasPermission('manage_employees')) {
      vendorMenuItems.push({
        title: 'Employee',
        icon: FileText,
        roles: ['vendor', 'vendor_employee'],
        permissions: ['manage_employees'],
        subItems: [
          {
            title: 'List',
            url: '/admin/employees',
            icon: FileText,
            roles: ['vendor', 'vendor_employee'],
            permissions: ['manage_employees']
          }
        ],
      });
    }

    // Payout access with permission checks
    if (hasPermission('view_payouts')) {
      vendorMenuItems.push({
        title: 'Payouts',
        icon: Currency,
        roles: ['vendor', 'vendor_employee'],
        permissions: ['view_payouts'],
        url: '/admin/vendorpayouts'
      });
    }
  if (user?.role == 'vendor') {
    // Profile access
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
    // Check role access
    if (!item.roles.includes(user?.role || '')) {
      return false;
    }
    
    // Check permission access for vendor employees
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
              <SidebarMenuButton className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {accessibleSubItems.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton asChild isActive={pathname === subItem.url}>
                      <Link to={subItem.url || '#'}>
                        <subItem.icon className="h-4 w-4" />
                        <span>{subItem.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={pathname === item.url}>
          <Link to={item.url || '#'}>
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-4 py-2">
          <Building className="h-6 w-6" />
          <div className="flex flex-col">
            <span className="font-semibold">
              {user?.role === 'admin' ? 'Admin' : user?.role === 'vendor_employee' ? 'Employee' : 'Host'} Panel
            </span>
            <span className="text-xs text-muted-foreground">{user?.name}</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <ScrollArea className="my-4">
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
              className="w-full justify-start" 
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
