
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// Mock data - in a real app, this would come from an API
const mockBookings = [
  {
    id: '1',
    studentName: 'John Doe',
    roomNumber: '101',
    bedNumber: 'A1',
    checkInDate: new Date('2025-05-15'),
    checkOutDate: new Date('2026-05-15'),
    amount: 45000,
    status: 'active'
  },
  {
    id: '2',
    studentName: 'Jane Smith',
    roomNumber: '102',
    bedNumber: 'B2',
    checkInDate: new Date('2025-05-20'),
    checkOutDate: new Date('2026-05-20'),
    amount: 50000,
    status: 'pending'
  },
  {
    id: '3',
    studentName: 'Bob Johnson',
    roomNumber: '103',
    bedNumber: 'C3',
    checkInDate: new Date('2025-04-10'),
    checkOutDate: new Date('2025-06-10'),
    amount: 15000,
    status: 'completed'
  }
];

export const HostelBookingsList = () => {
  const { hostelId } = useParams<{ hostelId: string }>();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [hostelId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // In a real app, we would fetch from the API
      // const response = await bookingsService.getHostelBookings(hostelId);
      
      // Using mock data for now
      setTimeout(() => {
        setBookings(mockBookings);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (bookingId: string) => {
    // Navigate to booking details
    console.log("View booking details:", bookingId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hostel Bookings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found for this hostel.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Room & Bed</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.studentName}</TableCell>
                    <TableCell>Room {booking.roomNumber}, Bed {booking.bedNumber}</TableCell>
                    <TableCell>{format(booking.checkInDate, 'dd MMM yyyy')}</TableCell>
                    <TableCell>{format(booking.checkOutDate, 'dd MMM yyyy')}</TableCell>
                    <TableCell>₹{booking.amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(booking.id)}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
