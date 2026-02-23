
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStatistics } from '@/hooks/use-dashboard-statistics';
import { BarChart, TrendingUp, Users, AlertCircle, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { adminBookingsService } from '@/api/adminBookingsService';

export function DynamicStatisticsCards() {
  const { statistics, loading, error } = useDashboardStatistics();
  const [activeResidents, setActiveResidents] = useState({
    activeResidents: 0,
    totalCapacity: 0,
    occupancyPercentage: 0
  });
  const [residentsLoading, setResidentsLoading] = useState(true);

const hasFetched = useRef(false);

useEffect(() => {
  if (hasFetched.current) return;

  const fetchActiveResidents = async () => {
    try {
      const response = await adminBookingsService.getActiveResidents();
      if (response.success) {
        setActiveResidents(response.data);
      }
    } catch (error) {
      console.error('Error fetching active residents:', error);
    } finally {
      setResidentsLoading(false);
    }
  };

  fetchActiveResidents();
  hasFetched.current = true;
}, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card className="shadow-none border rounded-lg">
        <div className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
            {loading ? <Skeleton className="h-6 w-20 mt-1" /> : (
              <>
                <p className="text-xl font-bold mt-0.5">₹{statistics.totalRevenue.toLocaleString()}</p>
                <p className="text-[10px] text-emerald-600">₹{statistics.revenueToday.toLocaleString()} today</p>
              </>
            )}
          </div>
          <BarChart className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg">
        <div className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Residents</p>
            {residentsLoading ? <Skeleton className="h-6 w-14 mt-1" /> : (
              <>
                <p className="text-xl font-bold mt-0.5">{activeResidents.activeResidents}</p>
                <p className="text-[10px] text-muted-foreground">{activeResidents.occupancyPercentage}% occupancy</p>
              </>
            )}
          </div>
          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg">
        <div className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Seat Availability</p>
            {loading ? <Skeleton className="h-6 w-14 mt-1" /> : (
              <p className="text-xl font-bold mt-0.5">{statistics.availableSeats}</p>
            )}
          </div>
          <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg">
        <div className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Payments</p>
            {loading ? <Skeleton className="h-6 w-20 mt-1" /> : (
              <p className="text-xl font-bold mt-0.5">₹{statistics.pendingPayments.toLocaleString()}</p>
            )}
          </div>
          <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </Card>
    </div>
  );
}
