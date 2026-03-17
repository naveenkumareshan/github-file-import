
import { useState, useEffect, useRef } from 'react';
import { adminBookingsService } from '@/api/adminBookingsService';
import { formatCurrency } from '@/utils/currency';

export interface DashboardStats {
  totalRevenue: number;
  revenueToday: number;
  pendingPayments: number;
  activeSubscriptions: number;
  occupancyRate: number;
  availableSeats: number;
  totalCabins: number;
  currentYear: number;
  activeResidents: number;
  totalCapacity: number;
  occupancyPercentage: number;
}

export interface TopFillingRoom {
  id: string;
  name: string;
  occupancyRate: number;
  category: string;
  totalSeats: number;
  bookedSeats: number;
}

export interface RevenueDataPoint {
  name: string;
  revenue: number;
}

export interface OccupancyDataPoint {
  name: string;
  occupancy: number;
}

export interface AdminDashboardData {
  stats: DashboardStats;
  topFillingRooms: TopFillingRoom[];
  revenueData: RevenueDataPoint[];
  occupancyData: OccupancyDataPoint[];
  expiringBookings: any[];
  loading: boolean;
  error: string | null;
}

export function useAdminDashboardData(partnerUserId?: string): AdminDashboardData {
  const [data, setData] = useState<AdminDashboardData>({
    stats: {
      totalRevenue: 0, revenueToday: 0, pendingPayments: 0,
      activeSubscriptions: 0, occupancyRate: 0, availableSeats: 0,
      totalCabins: 0, currentYear: 0, activeResidents: 0,
      totalCapacity: 0, occupancyPercentage: 0,
    },
    topFillingRooms: [],
    revenueData: [],
    occupancyData: [],
    expiringBookings: [],
    loading: true,
    error: null,
  });

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchAll = async () => {
      try {
        // All 4 fetches in parallel
        const [statsResult, topRoomsResult, revenueResult, occupancyResult, expiringResult] = await Promise.all([
          adminBookingsService.getDashboardStats(partnerUserId),
          adminBookingsService.getTopFillingRooms(10, partnerUserId),
          adminBookingsService.getMonthlyRevenue(new Date().getFullYear(), partnerUserId),
          adminBookingsService.getMonthlyOccupancy(new Date().getFullYear(), partnerUserId),
          adminBookingsService.getExpiringBookings(7, partnerUserId),
        ]);

        // Process stats
        let stats = data.stats;
        if (statsResult.success && statsResult.data) {
          const d = statsResult.data;
          const totalCapacity = d.total_capacity || 0;
          const activeResidents = d.active_residents || 0;
          const occupancyRate = totalCapacity > 0 ? Math.round((activeResidents / totalCapacity) * 100) : 0;
          stats = {
            totalRevenue: d.total_revenue || 0,
            revenueToday: d.today_revenue || 0,
            currentYear: d.current_year || 0,
            pendingPayments: d.pending_bookings || 0,
            activeSubscriptions: d.completed_bookings || 0,
            occupancyRate,
            availableSeats: d.available_seats || 0,
            totalCabins: d.total_bookings || 0,
            activeResidents,
            totalCapacity,
            occupancyPercentage: occupancyRate,
          };
        }

        // Process top rooms
        const topFillingRooms: TopFillingRoom[] = (topRoomsResult.success && topRoomsResult.data)
          ? topRoomsResult.data.slice(0, 10)
          : [];

        // Process revenue chart data
        const revenueData: RevenueDataPoint[] = (revenueResult.success && revenueResult.data)
          ? (revenueResult.data as any[]).map((m: any) => ({ name: m.monthName.slice(0, 3), revenue: m.revenue }))
          : [];

        // Process occupancy chart data
        const occupancyData: OccupancyDataPoint[] = (occupancyResult.success && occupancyResult.data)
          ? (occupancyResult.data as any[]).map((m: any) => ({ name: m.monthName.slice(0, 3), occupancy: m.occupancyRate }))
          : [];

        // Process expiring bookings
        const expiringBookings = (expiringResult.success && expiringResult.data)
          ? (expiringResult.data as any[]).slice(0, 5)
          : [];

        setData({
          stats, topFillingRooms, revenueData, occupancyData, expiringBookings,
          loading: false, error: null,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setData(prev => ({ ...prev, loading: false, error: 'Failed to load dashboard data' }));
      }
    };

    fetchAll();
  }, [partnerUserId]);

  return data;
}
