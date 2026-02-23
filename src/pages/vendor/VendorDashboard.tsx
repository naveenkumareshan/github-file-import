
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { DollarSign, Users, Calendar, MapPin, Settings, Eye, Banknote } from 'lucide-react';

const VendorDashboard: React.FC = () => {
  // Mock data - replace with actual API calls
  const dashboardData = {
    totalRevenue: 125000,
    pendingPayout: 8500,
    activeBookings: 23,
    totalSeats: 48,
    availableSeats: 12,
    occupiedSeats: 36,
    properties: 3
  };

  return (
    <div className="min-h-screen bg-accent/30">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-cabin-dark">Partner Dashboard</h1>
            <p className="text-cabin-dark/70">Manage your properties and track earnings</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-2">
            <Link to="/vendor/seats">
              <Button variant="outline" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Seat Management
              </Button>
            </Link>
            <Link to="/vendor/auto-payout-settings">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Payout Settings
              </Button>
            </Link>
            <Link to="/vendor/payouts">
              <Button className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Payouts
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardData.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All time earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardData.pendingPayout.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Available for withdrawal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.activeBookings}</div>
              <p className="text-xs text-muted-foreground">Current occupancy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.properties}</div>
              <p className="text-xs text-muted-foreground">Total locations</p>
            </CardContent>
          </Card>
        </div>

        {/* Seat Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Seat Overview
                <Link to="/vendor/seats">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Seats</span>
                  <Badge variant="outline">{dashboardData.totalSeats}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Occupied</span>
                  <Badge className="bg-red-100 text-red-800">{dashboardData.occupiedSeats}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Available</span>
                  <Badge className="bg-green-100 text-green-800">{dashboardData.availableSeats}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${(dashboardData.occupiedSeats / dashboardData.totalSeats) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((dashboardData.occupiedSeats / dashboardData.totalSeats) * 100)}% occupancy rate
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link to="/vendor/seats" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    Manage Seats
                  </Button>
                </Link>
                <Link to="/vendor/payouts" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Request Payout
                  </Button>
                </Link>
                <Link to="/vendor/auto-payout-settings" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Auto Payout Settings
                  </Button>
                </Link>
                <Link to="/vendor/profile" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <footer className="bg-cabin-dark text-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/50 text-sm">
            <p>© 2025 Inhalestays. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VendorDashboard;
