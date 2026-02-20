
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { adminBookingsService } from '@/api/adminBookingsService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AlertCircle, ArrowLeft, Calendar, User, MapPin, CreditCard, AlertTriangle } from 'lucide-react';

export default function AdminBookingView() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await adminBookingsService.getBookingById(bookingId);
        if (response.success) {
          setBooking(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch booking details');
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        setError(error.message || 'An error occurred while fetching booking details');
        toast({
          title: 'Error',
          description: 'Failed to load booking details',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, toast]);

  const handleStatusChange = async (status: string) => {
    try {
      const response = await adminBookingsService.updateBooking(bookingId!, {
        paymentStatus: status as any
      });
      
      if (response.success) {
        toast({
          title: 'Status Updated',
          description: `Booking status has been updated to ${status}`
        });
        
        // Update local state
        setBooking({
          ...booking,
          paymentStatus: status
        });
      } else {
        throw new Error(response.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update booking status',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Unable to load booking details. Please try again.'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate('/admin/bookings')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const formatDuration = (booking: any) => {
    if (booking.bookingDuration === 'daily') {
      return `${booking.durationCount || 1} day(s)`;
    } else if (booking.bookingDuration === 'weekly') {
      return `${booking.durationCount || 1} week(s)`;
    } else {
      return `${booking.months || 1} month(s)`;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'outline';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Booking Details</h1>
        <Button variant="outline" onClick={() => navigate('/admin/bookings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Unable to load booking details. Please try again.'}
          </AlertDescription>
        </Alert>
      ) : booking ? (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle>
                Booking #{booking.bookingId || booking._id}
              </CardTitle>
              <Badge variant={
                booking.paymentStatus === 'completed' ? 'default' :
                booking.paymentStatus === 'pending' ? 'outline' : 'destructive'
              }>
                {booking.paymentStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Booking Period
                </h3>
                <div className="text-sm space-y-1 ml-6">
                  <div>Start Date: {format(new Date(booking.startDate), 'dd MMM yyyy')}</div>
                  <div>End Date: {format(new Date(booking.endDate), 'dd MMM yyyy')}</div>
                  <div>Duration: {booking.bookingDuration === 'daily' 
                    ? `${booking.durationCount || 1} day(s)` 
                    : booking.bookingDuration === 'weekly'
                    ? `${booking.durationCount || 1} week(s)`
                    : `${booking.durationCount || 1} month(s)`}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Customer Details
                </h3>
                <div className="text-sm space-y-1 ml-6">
                  <div>Name: {booking.userId?.name || 'N/A'}</div>
                  <div>Email: {booking.userId?.email || 'N/A'}</div>
                  <div>Phone: {booking.userId?.phone || 'N/A'}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {booking.cabinId ? 'Cabin Details' : booking.hostelId ? 'Hostel Details' : 'Booking Details'}
                </h3>
                <div className="text-sm space-y-1 ml-6">
                  {booking.cabinId && (
                    <>
                      <div>Cabin: {booking.cabinId.name || 'N/A'}</div>
                      <div>Seat Number: {booking.seatId?.number || 'N/A'}</div>
                    </>
                  )}
                  {booking.hostelId && (
                    <>
                      <div>Hostel: {booking.hostelId.name || 'N/A'}</div>
                      <div>Bed Number: {booking.bedId?.number || 'N/A'}</div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Details
                </h3>
                <div className="text-sm space-y-1 ml-6">
                  <div>Total Amount: ₹{booking.totalPrice?.toFixed(2) || '0.00'}</div>
                  <div>Payment Method: {booking.paymentMethod || 'N/A'}</div>
                  <div>Payment Date: {booking.paymentDate ? format(new Date(booking.paymentDate), 'dd MMM yyyy') : 'N/A'}</div>
                </div>
              </div>
            </div>
            
            {booking.paymentStatus !== 'completed' && (
              <div className="mt-6 pt-4 border-t">
                <h3 className="font-semibold mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={booking.paymentStatus === 'completed' ? 'outline' : 'default'}
                    onClick={() => handleStatusChange('completed')}
                    disabled={booking.paymentStatus === 'completed'}
                  >
                    Mark as Completed
                  </Button>
                  <Button 
                    variant={booking.paymentStatus === 'pending' ? 'outline' : 'secondary'}
                    onClick={() => handleStatusChange('pending')}
                    disabled={booking.paymentStatus === 'pending'}
                  >
                    Mark as Pending
                  </Button>
                  <Button 
                    variant={booking.paymentStatus === 'failed' ? 'outline' : 'destructive'}
                    onClick={() => handleStatusChange('failed')}
                    disabled={booking.paymentStatus === 'failed'}
                  >
                    Mark as Failed
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-8">No booking data found.</div>
      )}
    </div>
  );
}
