
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

interface StatsSummaryProps {
  bookings: StoredBooking[];
}

export const StatsSummary: React.FC<StatsSummaryProps> = ({ bookings }) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get next payment date and amount (if any bookings exist)
  const getNextPaymentInfo = () => {
    if (bookings.length === 0 || !bookings.some(b => b.paymentStatus === 'completed')) {
      return { date: null, amount: 0 };
    }
    
    const activeBooking = bookings.find(b => b.paymentStatus === 'completed');
    if (!activeBooking) return { date: null, amount: 0 };
    
    const startDate = new Date(activeBooking.date);
    const monthlyAmount = activeBooking.totalPrice / activeBooking.months;
    
    // Next payment is one month from start date
    startDate.setMonth(startDate.getMonth() + 1);
    return { 
      date: startDate.toISOString(),
      amount: Math.round(monthlyAmount) 
    };
  };
  
  // Get subscription end date (if any active subscriptions)
  const getSubscriptionEndDate = () => {
    if (bookings.length === 0 || !bookings.some(b => b.paymentStatus === 'completed')) {
      return null;
    }
    
    const activeBooking = bookings.find(b => b.paymentStatus === 'completed');
    if (!activeBooking) return null;
    
    const endDate = new Date(activeBooking.date);
    endDate.setMonth(endDate.getMonth() + activeBooking.months);
    return endDate.toISOString();
  };
  
  const nextPayment = getNextPaymentInfo();
  const subscriptionEnd = getSubscriptionEndDate();
  const activeSubscriptions = bookings.filter(b => b.paymentStatus === 'completed').length;

  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{activeSubscriptions}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Next Payment</CardTitle>
        </CardHeader>
        <CardContent>
          {nextPayment.date ? (
            <>
              <p className="text-3xl font-bold">₹{nextPayment.amount}</p>
              <p className="text-sm text-muted-foreground">Due on {formatDate(nextPayment.date)}</p>
            </>
          ) : (
            <p className="text-3xl font-bold">₹0</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Subscription End</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionEnd ? (
            <p className="text-3xl font-bold">{formatDate(subscriptionEnd)}</p>
          ) : (
            <p className="text-3xl font-bold">No active subscription</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
