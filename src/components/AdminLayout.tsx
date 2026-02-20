import React from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";

const AdminLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <SidebarProvider>
        <div className="flex flex-1 w-full">
          <AdminSidebar />
          <SidebarInset className="flex-1 flex flex-col min-h-screen">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 sticky top-0 z-10">
              <SidebarTrigger className="-ml-1" />
              <div className="mx-2 h-4 w-px bg-border" />
              <span className="text-sm font-medium text-muted-foreground">
                {user?.role === "admin" ? "Admin" : user?.role === "vendor_employee" ? "Employee" : "Host"} Panel
              </span>
            </header>

            <main className="flex-1 p-6 bg-muted/20 min-h-full">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminLayout;
