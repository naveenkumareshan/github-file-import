
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStatistics } from '@/hooks/use-dashboard-statistics';
import { BarChart, TrendingUp, Users, AlertCircle, UserCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { adminBookingsService } from '@/api/adminBookingsService';
import { useLoadingTimeout } from '@/hooks/use-loading-timeout';
import { EmptyState } from '@/components/ui/empty-state';

export function DynamicStatisticsCards() {
  const { statistics, loading, error } = useDashboardStatistics();
  const [activeResidents, setActiveResidents] = useState({
    activeResidents: 0,
    totalCapacity: 0,
    occupancyPercentage: 0
  });
  const [residentsLoading, setResidentsLoading] = useState(true);
  const timedOut = useLoadingTimeout(loading || residentsLoading);

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

  if (timedOut) {
    return (
      <div className="mb-8">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load statistics"
          description="Unable to fetch data. Please refresh."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      {/* Total Revenue Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <p className="text-3xl font-bold">₹{statistics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">
                ₹{statistics.revenueToday.toLocaleString()} today
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Active Residents Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Active Residents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {residentsLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-3xl font-bold">{activeResidents.activeResidents}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {activeResidents.occupancyPercentage}% occupancy
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Seats Availability Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Seat Availability
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <>
              <p className="text-3xl font-bold">{statistics.availableSeats}</p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Pending Payments Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-3xl font-bold">₹{statistics.pendingPayments.toLocaleString()}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
