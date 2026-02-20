
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { hostelService } from '@/api/hostelService';
import ErrorBoundary from '@/components/ErrorBoundary';
import { CheckCircle, Calendar, Bed, Building, CreditCard, FileText, Printer, Download } from 'lucide-react';
import { format } from 'date-fns';

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { bookingId } = location.state || {};
  
  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!bookingId) {
        setError('Booking ID not found');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch booking details
        const response = await hostelService.getBookingById(bookingId);
        
        if (response.success) {
          setBooking(response.data);
        } else {
          setError('Failed to load booking details');
          toast({
            title: "Error",
            description: "Failed to load booking details",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setError('Failed to load booking details');
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId, toast]);
  
  const handlePrintBooking = () => {
    window.print();
  };
  
  const handleViewBookings = () => {
    navigate('/student/bookings');
  };
  
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-grow container mx-auto p-6 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (error || !booking) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <div className="flex-grow container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Error</CardTitle>
              <CardDescription>
                {error || 'Booking information not found'}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate('/hostels')}>Browse Hostels</Button>
            </CardFooter>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        
        <div className="flex-grow container mx-auto p-6">
          <div className="max-w-3xl mx-auto">
            <Card className="border-green-500">
              <CardHeader className="text-center pb-4 border-b">
                <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-green-600">Booking Confirmed!</CardTitle>
                <CardDescription className="text-base">
                  Your booking has been successfully confirmed and payment received.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Booking Reference</h3>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">Booking ID</div>
                      <div className="font-mono font-medium">{booking._id}</div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-sm text-muted-foreground">Booking Date</div>
                      <div>{format(new Date(booking.createdAt), 'PPP')}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Building className="h-5 w-5 text-primary" />
                      Accommodation Details
                    </h3>
                    
                    {booking.hostel && booking.room && (
                      <div className="pl-7">
                        <div className="font-medium">{booking.hostel.name}</div>
                        <div className="text-muted-foreground">{booking.hostel.location}</div>
                        <div className="mt-2">
                          <span className="font-medium">Room:</span> {booking.room.name}, Room #{booking.room.roomNumber}
                        </div>
                        <div>
                          <span className="font-medium">Sharing Type:</span> {booking.sharingType}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Stay Details
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 pl-7">
                      <div>
                        <div className="text-sm text-muted-foreground">Check-In</div>
                        <div className="font-medium">{format(new Date(booking.startDate), 'PPP')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Check-Out</div>
                        <div className="font-medium">{format(new Date(booking.endDate), 'PPP')}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-medium">
                          {booking.bookingDuration === 'daily' && `${booking.durationCount} days`}
                          {booking.bookingDuration === 'weekly' && `${booking.durationCount} weeks`}
                          {booking.bookingDuration === 'monthly' && `${booking.durationCount} months`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Payment Details
                    </h3>
                    
                    <div className="pl-7 space-y-2">
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Payment Status</div>
                        <div className="font-medium text-green-600">Paid</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Payment Method</div>
                        <div className="font-medium">{booking.paymentMethod || 'Online Payment'}</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Payment Date</div>
                        <div className="font-medium">{booking.paymentDate ? format(new Date(booking.paymentDate), 'PPP') : '-'}</div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-sm text-muted-foreground">Total Amount</div>
                        <div className="font-bold">₹{booking.totalPrice}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Important Information</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      <li>Please carry a valid ID proof during check-in.</li>
                      <li>Check-in time is 12:00 PM and check-out time is 11:00 AM.</li>
                      <li>For early check-in or late check-out, please contact the hostel directly.</li>
                      <li>Cancellation policy: 100% refund if cancelled 48 hours before check-in.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none"
                  onClick={handlePrintBooking}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print Booking
                </Button>
                <Button 
                  className="flex-1 sm:flex-none"
                  onClick={handleViewBookings}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All Bookings
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default BookingConfirmation;
