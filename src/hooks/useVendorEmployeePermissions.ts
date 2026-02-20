
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface VendorEmployeePermissions {
  view_bookings: boolean;
  manage_bookings: boolean;
  view_reading_rooms: boolean;
  manage_reading_rooms: boolean;
  view_customers: boolean;
  manage_customers: boolean;
  view_reports: boolean;
  manage_employees: boolean;
  view_payouts: boolean;
  manage_payouts: boolean;
  view_dashboard: boolean;
  manage_students: boolean;
  seats_available_map: boolean;
  seats_available_edit:boolean;
  manage_reviews:boolean;
}

export const useVendorEmployeePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<VendorEmployeePermissions>({
    view_bookings: false,
    manage_bookings: false,
    view_reading_rooms: false,
    manage_reading_rooms: false,
    view_customers: false,
    manage_customers: false,
    view_reports: false,
    manage_employees: false,
    view_payouts: false,
    manage_payouts: false,
    view_dashboard: false,
    manage_students: false,
    seats_available_map:false,
    seats_available_edit:false,
    manage_reviews:false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (user?.role === 'vendor_employee') {
        try {
          // In a real app, this would fetch from an API
          // For now, we'll simulate permissions based on user data
          const mockPermissions: VendorEmployeePermissions = {
            view_bookings: user?.permissions?.includes('view_bookings') || false,
            manage_bookings: user?.permissions?.includes('manage_bookings') || false,
            view_reading_rooms: user?.permissions?.includes('view_reading_rooms') || false,
            manage_reading_rooms: user?.permissions?.includes('manage_reading_rooms') || false,
            view_customers: user?.permissions?.includes('view_customers') || false,
            manage_customers: user?.permissions?.includes('manage_customers') || false,
            view_reports: user?.permissions?.includes('view_reports') || false,
            manage_employees: user?.permissions?.includes('manage_employees') || false,
            view_payouts: user?.permissions?.includes('view_payouts') || false,
            manage_payouts: user?.permissions?.includes('manage_payouts') || false,
            manage_students: user?.permissions?.includes('manage_students') || false,
            seats_available_map: user?.permissions?.includes('seats_available_map') || false,
            seats_available_edit: user?.permissions?.includes('seats_available_edit') || false,
            view_dashboard: user?.permissions?.includes('view_dashboard') || false,
            manage_reviews: user?.permissions?.includes('manage_reviews') || false,
          };
          setPermissions(mockPermissions);
        } catch (error) {
          console.error('Error fetching permissions:', error);
        }
      } else if (user?.role === 'vendor') {
        // Vendors have all permissions
        setPermissions({
          view_bookings: true,
          manage_bookings: true,
          view_reading_rooms: true,
          manage_reading_rooms: true,
          view_customers: true,
          manage_customers: true,
          view_reports: true,
          manage_employees: true,
          view_payouts: true,
          manage_payouts: true,
          view_dashboard: true,
          manage_students: true,
          seats_available_map: true,
          seats_available_edit : true,
          manage_reviews: true
        });
      }
      
      setLoading(false);
    };

    fetchPermissions();
  }, [user]);

  const hasPermission = (permission: keyof VendorEmployeePermissions): boolean => {
    return permissions[permission] || false;
  };

  const hasAnyPermission = (permissionList: (keyof VendorEmployeePermissions)[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    loading
  };
};
