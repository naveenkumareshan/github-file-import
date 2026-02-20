
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FileText, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardStatistics } from "@/components/admin/DashboardStatistics";
import { UserSessionsManagement } from "@/components/admin/UserSessionsManagement";
import { useSearchParams } from 'react-router-dom';
import { useVendorEmployeePermissions } from "@/hooks/useVendorEmployeePermissions";

const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'dashboard' | 'sessions' | null;
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions'>(
    tabFromUrl || 'dashboard'
  );
  const { hasPermission } = useVendorEmployeePermissions();
  
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

    // Update URL when tab changes
  const handleTabChange = (value: string) => {
    const newTab = value as 'dashboard' | 'sessions';
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto p-2">
        { (user.role =='admin' || user.role =='vendor'  || hasPermission('view_dashboard')) && 
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              Admin Dashboard
            </CardTitle>
            <div className="flex space-x-2">
               <Button
                variant={activeTab === 'dashboard' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTabChange('dashboard')}
              >
                Dashboard
              </Button>
              { user.role =='admin' && 
              <Button
                variant={activeTab === 'sessions' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTabChange('sessions')}
                className="flex items-center gap-1"
              >
                <Users className="h-4 w-4" />
                User Sessions
              </Button>
              }
              
              <Link to="/admin/reports">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Reports
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </CardHeader>
          <CardDescription className="p-4 pb-4">
             Manage reading rooms, hostels, student accommodations, and user sessions.
          </CardDescription>
          <CardContent>
            {activeTab === 'dashboard' && <DashboardStatistics />}
            {activeTab === 'sessions' && <UserSessionsManagement />}
          </CardContent>
        </Card>
        }
      </div>
    </div>
  );
};

export default AdminDashboard;
