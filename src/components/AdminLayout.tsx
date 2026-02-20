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
          <SidebarInset className="flex-1">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <div className="mx-2 h-4 w-px bg-sidebar-border" />
              <h1 className="text-lg font-semibold">
                {user?.role === "admin" ? "Admin" : "Host"} Dashboard
              </h1>
            </header>

            <main className="flex-1 p-6">
              <Outlet />   {/* 👈 nested admin routes render here */}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminLayout;
