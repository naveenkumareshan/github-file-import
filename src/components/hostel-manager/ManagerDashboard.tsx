
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Building, Users, Home, DollarSign } from 'lucide-react';
import { hostelService } from '@/api/hostelService';
import { useAuth } from '@/hooks/use-auth';

export const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalHostels: 0,
    totalRooms: 0,
    totalBeds: 0,
    occupancyRate: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Get hostels managed by the current user
      const hostelsResponse = await hostelService.getUserHostels();
      
      if (hostelsResponse.success && hostelsResponse.data) {
        const hostels = hostelsResponse.data;
        
        // Calculate basic statistics
        const totalRooms = 0;
        const totalBeds = 0;
        const occupiedBeds = 0;
        
        // For each hostel, we'd gather room and bed data
        // This is a simplified example - in a real app we would fetch this data from the API
        
        setStats({
          totalHostels: hostels.length,
          totalRooms: totalRooms,
          totalBeds: totalBeds,
          occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
          totalRevenue: 0 // This would come from a separate API call for financial data
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hostels</p>
                  <h3 className="text-2xl font-bold">{stats.totalHostels}</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Building className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                  <h3 className="text-2xl font-bold">{stats.totalRooms}</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Home className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Beds</p>
                  <h3 className="text-2xl font-bold">{stats.totalBeds}</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <h3 className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="p-2 bg-primary/10 rounded-full">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Occupancy Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1 text-sm">
                <span>Overall Occupancy</span>
                <span>{stats.occupancyRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${stats.occupancyRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-6">
            Booking data will be displayed here
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
