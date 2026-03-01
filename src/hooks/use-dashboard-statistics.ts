
import { useState, useEffect, useRef } from 'react';
import { adminBookingsService } from '@/api/adminBookingsService';
import { adminSeatsService } from '@/api/adminSeatsService';

export type DashboardStatistics = {
  totalRevenue: number;
  revenueToday: number;
  pendingPayments: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  occupancyRate: number;
  pendingSeats: number;
  availableSeats: number;
  totalCabins: number;
  currentYear:number;
};

export function useDashboardStatistics() {
  const [statistics, setStatistics] = useState<DashboardStatistics>({
    totalRevenue: 0,
    revenueToday: 0,
    pendingPayments: 0,
    activeSubscriptions: 0,
    newSubscriptionsThisMonth: 0,
    occupancyRate: 0,
    pendingSeats: 0,
    availableSeats: 0,
    totalCabins: 0,
    currentYear:0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
     if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

    const fetchDashboardStatistics = async () => {
      setLoading(true);
      setError(null);
      try {
        const bookingStats = await adminBookingsService.getBookingStats('month');
        const seatsResponse = await adminSeatsService.getActiveSeatsCountSeats({isAvailable:true});
        const revenueResponse = await adminBookingsService.getRevenueByTransaction();

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        
        const occupancyData = await adminBookingsService.getOccupancyReports({
          startDate: startOfMonth,
          endDate: endOfMonth
        });
        
        let availableSeats = 0;
        const pendingSeats = 0;
        
        if (seatsResponse.success) {
          availableSeats = (seatsResponse as any).data || seatsResponse.count || 0;
        }
        
        const dashboardStats: DashboardStatistics = {
          totalRevenue: revenueResponse.success ? revenueResponse.data?.totalRevenue || 0 : 0,
          revenueToday: revenueResponse.success ? (revenueResponse.data as any)?.todayRevenue || 0 : 0,
          currentYear: revenueResponse.success ? (revenueResponse.data as any)?.currentYear || 0 : 0,
          pendingPayments: bookingStats.success ? (bookingStats.data as any)?.pendingPayments || bookingStats.data?.pending || 0 : 0,
          activeSubscriptions: bookingStats.success ? (bookingStats.data as any)?.activeSubscriptions || bookingStats.data?.completed || 0 : 0,
          newSubscriptionsThisMonth: bookingStats.success ? (bookingStats.data as any)?.newSubscriptionsThisMonth || 0 : 0,
          occupancyRate: occupancyData.success ? (occupancyData.data as any)?.overallOccupancy || 0 : 0,
          pendingSeats: pendingSeats,
          availableSeats: availableSeats,
          totalCabins: bookingStats.success ? (bookingStats.data as any)?.totalCabins || bookingStats.data?.total || 0 : 0,
        };
        
        setStatistics(dashboardStats);
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStatistics();
  }, []);

  return { statistics, loading, error };
}
