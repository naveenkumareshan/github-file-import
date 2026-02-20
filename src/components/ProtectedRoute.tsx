
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
  
  // Show loading state
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Check if user is authenticated
  if (!isAuthenticated) {
    // Add current path to the redirect URL as a query parameter
    const loginPath = `${redirectPath}?from=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={loginPath} replace />;
  }
  
  // If role is required, check if user has the required role
  if (requiredRole && user?.role !== requiredRole) {
    // Special handling for hostel_manager role
    if (requiredRole === 'admin' && (user?.role === 'admin' || user?.role === 'vendor' || user?.role === 'vendor_employee')) {
      // Allow admins to access hostel manager routes
      return children ? <>{children}</> : <Outlet />;
    }
    
    // Redirect students to student dashboard if they try to access admin routes
    if (user?.role === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    }
    // Redirect admins to admin dashboard if they try to access student routes
    if (user?.role === 'admin' || user?.role === 'vendor' || user?.role === 'vendor_employee') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // Redirect hostel managers to hostel manager dashboard
    // if (user?.role === 'vendor_employee') {
    //   return <Navigate to="/hostel-manager/dashboard" replace />;
    // }
    // Default fallback
    return <Navigate to={redirectPath} replace />;
  }
  
  // If all checks pass, render the protected content
  return children ? <>{children}</> : <Outlet />;
};
