
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BookingData } from '../../components/BookingForm';

interface StoredBooking extends BookingData {
  bookingDate: string;
  cabin: {
    id: number;
    name: string;
    category: string;
  };
  seat: {
    id: number;
    number: number;
  };
}

interface SubscriptionCardProps {
  bookings: StoredBooking[];
  getSubscriptionEndDate: () => string | null;
  formatDate: (date: string) => string;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ 
  bookings, 
  getSubscriptionEndDate,
  formatDate 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Subscriptions</CardTitle>
        <CardDescription>Your active cabin subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">No active subscriptions</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">{booking.cabin.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                  }`}>
                    {booking.paymentStatus === 'completed' ? 'Active' : 'Pending'}
                  </span>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>Seat #{booking.seat.number}</p>
                  <p>{formatDate(booking.date)} - {formatDate(getSubscriptionEndDate() || '')}</p>
                  <p>
                    <span className="font-medium text-foreground">₹{booking.totalPrice}</span> 
                    {' '}for {booking.months} {booking.months === 1 ? 'month' : 'months'}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-xs">
                    {/* Add null check for category */}
                    {booking.cabin.category ? 
                      `${booking.cabin.category.charAt(0).toUpperCase() + booking.cabin.category.slice(1)} Cabin` : 
                      'Standard Cabin'}
                  </span>
                  {booking.paymentStatus === 'completed' && (
                    <button className="text-xs text-cabin-wood hover:text-cabin-dark">Manage</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
