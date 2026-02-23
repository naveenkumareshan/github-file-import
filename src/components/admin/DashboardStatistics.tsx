
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicStatisticsCards } from './DynamicStatisticsCards';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminBookingsService } from '@/api/adminBookingsService';
import { OccupancyChart } from './OccupancyChart';
import { RevenueChart } from './RevenueChart';
import { DashboardExpiringBookings } from './DashboardExpiringBookings';
import { TrendingUp } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import { EmptyState } from '@/components/ui/empty-state';

interface TopFillingRoom {
  id: string;
  name: string;
  occupancyRate: number;
  category: string;
  totalSeats: number;
  bookedSeats: number;
}

export function DashboardStatistics() {
  const [topFillingRooms, setTopFillingRooms] = useState<TopFillingRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState(false);
  const hasFetchedRef = useRef(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(false);
      const topRoomsResponse = await adminBookingsService.getTopFillingRooms();
      if (topRoomsResponse.success && topRoomsResponse.data) {
        setTopFillingRooms(topRoomsResponse.data.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchDashboardData();
  }, []);
  
  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'luxury': return 'bg-purple-500 hover:bg-purple-600';
      case 'premium': return 'bg-blue-500 hover:bg-blue-600';
      case 'standard': return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="space-y-3">
      <ErrorBoundary>
        <DynamicStatisticsCards />
      </ErrorBoundary>

      {/* Top Filling Reading Rooms */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Top Filling Reading Rooms
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Rooms with highest seat occupancy rates</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={TrendingUp}
              title="No data available"
              description="Unable to fetch data. Please refresh."
              onRetry={() => { hasFetchedRef.current = false; fetchDashboardData(); }}
            />
          ) : topFillingRooms.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No room data available" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Room Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Occupancy</TableHead>
                  <TableHead className="font-semibold">Booked / Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFillingRooms.map((room, idx) => (
                  <TableRow key={room.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <TableCell className="text-muted-foreground text-sm w-8">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      <Badge className={`capitalize ${getCategoryBadgeColor(room.category)}`}>
                        {room.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${room.occupancyRate}%` }} />
                        </div>
                        <span className="text-sm font-medium">{room.occupancyRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="font-medium">{room.bookedSeats}</span>
                      <span className="text-muted-foreground"> / {room.totalSeats}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-3">
        <ErrorBoundary>
          <RevenueChart />
        </ErrorBoundary>
        <ErrorBoundary>
          <OccupancyChart />
        </ErrorBoundary>
      </div>
      
      {/* Expiring Bookings */}
      <ErrorBoundary>
        <DashboardExpiringBookings />
      </ErrorBoundary>
    </div>
  );
}
