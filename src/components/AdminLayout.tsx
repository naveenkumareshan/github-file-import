import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";

const routeLabels: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/bookings": "All Transactions",
  "/admin/seat-transfer": "Transfer Seat",
  "/admin/manual-bookings": "Manual Booking",
  "/admin/students": "Users",
  "/admin/students-create": "Create User",
  "/admin/students-import": "Import Users",
  "/admin/coupons": "Coupons",
  "/admin/vendors": "Hosts",
  "/admin/rooms": "Reading Rooms",
  "/admin/hostels": "Hostels",
  "/admin/reports": "Reports",
  "/admin/payouts": "Payouts",
  "/admin/email-reports": "Email Reports",
  "/admin/email-templates": "Email Templates",
  "/admin/locations": "Locations",
  "/admin/banners": "Banners",
  "/admin/settings": "Settings",
  "/admin/deposits-restrictions": "Key Deposits",
  "/admin/reviews": "Reviews",
  "/admin/employees": "Employees",
  "/admin/vendorpayouts": "Payouts",
  "/admin/profile": "Profile",
  "/admin/seats-available-map": "Seat Map",
};

const getPageLabel = (pathname: string): string => {
  // Exact match first
  if (routeLabels[pathname]) return routeLabels[pathname];
  // Prefix match for dynamic routes
  for (const key of Object.keys(routeLabels)) {
    if (pathname.startsWith(key + "/")) return routeLabels[key];
  }
  return "Admin Panel";
};

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const pageLabel = getPageLabel(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <SidebarProvider>
        <div className="flex flex-1 w-full">
          <AdminSidebar />
          <SidebarInset className="flex-1 flex flex-col min-h-screen">
            <header
              className="flex h-13 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-10"
              style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / 0.04) 0%, hsl(var(--background)) 60%)' }}
            >
              <SidebarTrigger className="-ml-1" />
              <div className="mx-2 h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{user?.role === "admin" ? "Admin" : user?.role === "vendor_employee" ? "Employee" : "Host"} Panel</span>
                <span>/</span>
                <span className="text-foreground font-medium text-xs">{pageLabel}</span>
              </div>
            </header>

            <main className="flex-1 p-6 bg-muted/10 min-h-full">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminLayout;
