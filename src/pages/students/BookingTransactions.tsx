
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookingTransactionView } from '@/components/booking/BookingTransactionView';
import { ArrowLeft } from 'lucide-react';

const BookingTransactions = () => {
  const { bookingId, bookingType } = useParams<{ 
    bookingId: string; 
    bookingType: 'cabin' | 'hostel' 
  }>();
  const navigate = useNavigate();

  if (!bookingId || !bookingType) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Booking</h1>
            <p className="text-muted-foreground mb-4">
              The booking information is missing or invalid.
            </p>
            <Button onClick={() => navigate('/student/bookings')}>
              Go to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Transaction History</h1>
            <p className="text-muted-foreground">
              View payment history and validity information for this booking
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/student/bookings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Button>
        </div>

        <BookingTransactionView 
          bookingId={bookingId} 
          bookingType={bookingType}
          booking={null}
        />
      </div>
    </div>
  );
};

export default BookingTransactions;
