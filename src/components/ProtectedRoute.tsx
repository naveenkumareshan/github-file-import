
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';

interface ProtectedRouteProps {
  requiredRole?: string;
  redirectPath?: string;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  redirectPath = '/',
  children
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    const loginPath = `${redirectPath}?from=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={loginPath} replace />;
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    // Allow admins, vendors, vendor_employees to access admin-required routes
    if (requiredRole === 'admin' && (user?.role === 'admin' || user?.role === 'vendor' || user?.role === 'vendor_employee' || user?.role === 'super_admin')) {
      return children ? <>{children}</> : <Outlet />;
    }
    
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    if (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'vendor' || user?.role === 'vendor_employee') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to={redirectPath} replace />;
  }
  
  return children ? <>{children}</> : <Outlet />;
};
