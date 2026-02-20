
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicStatisticsCards } from './DynamicStatisticsCards';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminBookingsService } from '@/api/adminBookingsService';
import { OccupancyChart } from './OccupancyChart';
import { RevenueChart } from './RevenueChart';
import { toast } from '@/hooks/use-toast';
import { DashboardExpiringBookings } from './DashboardExpiringBookings';
import { TrendingUp } from 'lucide-react';

// Interface for top filling rooms data
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
  const hasFetchedRef = useRef(false);

  useEffect(() => {
     if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        
        // Fetch top filling rooms data
        const topRoomsResponse = await adminBookingsService.getTopFillingRooms();
        if (topRoomsResponse.success && topRoomsResponse.data) {
          setTopFillingRooms(topRoomsResponse.data.slice(0, 10)); // Show only top 5 rooms
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'luxury':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'premium':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'standard':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Statistics Cards */}
      <DynamicStatisticsCards />

      {/* Top Filling Reading Rooms */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Filling Reading Rooms
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead>Booked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFillingRooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryBadgeColor(room.category)}>
                        {room.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{room.occupancyRate}%</TableCell>
                    <TableCell>
                      {room.bookedSeats} / {room.totalSeats}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <RevenueChart />
        <OccupancyChart />
      </div>
      
      {/* Expiring Bookings */}
      <DashboardExpiringBookings />
    </div>
  );
}
