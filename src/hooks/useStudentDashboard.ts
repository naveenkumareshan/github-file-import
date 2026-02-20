
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BookingData } from '../components/BookingForm';

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

interface Payment {
  id: number;
  date: string;
  amount: number;
  method: string;
  status: string;
}


export const useStudentDashboard = () => {
  const { user } = useAuth();
  const [isChangeNameOpen, setIsChangeNameOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [usageStats, setUsageStats] = useState({
    weeklyUsage: [
      { name: 'Mon', hours: 5, visits: 2 },
      { name: 'Tue', hours: 3, visits: 1 },
      { name: 'Wed', hours: 7, visits: 3 },
      { name: 'Thu', hours: 4, visits: 2 },
      { name: 'Fri', hours: 6, visits: 2 },
      { name: 'Sat', hours: 8, visits: 3 },
      { name: 'Sun', hours: 2, visits: 1 }
    ],
    totalHoursSpent: 35,
    totalVisits: 14,
    averageStayDuration: 2.5
  });

  useEffect(() => {
    if (user) {
      // Load user's bookings from localStorage
      const storedBookings = localStorage.getItem(`bookings_${user.id}`);
      if (storedBookings) {
        setBookings(JSON.parse(storedBookings));
      }
      
      // Generate payment history from bookings
      if (storedBookings) {
        const bookingData = JSON.parse(storedBookings);
        const paymentHistory = bookingData
          .filter((booking: StoredBooking) => booking.paymentStatus === 'completed')
          .map((booking: StoredBooking) => ({
            id: Math.floor(Math.random() * 10000),
            date: booking.paymentDate || booking.bookingDate,
            amount: booking.totalPrice + 25, // Adding service fee
            method: booking.paymentMethod || 'Online',
            status: 'completed'
          }));
          
        setPayments(paymentHistory);
      }
      
      // In a real app, we would fetch usage statistics from an API
      // For now, we'll simulate it with random data
      generateUsageStats();
    }
  }, [user]);

  const generateUsageStats = () => {
    // In a real app, this would come from an API
    // For now, generate some mock data based on active bookings
    const hasActiveBookings = bookings.some(b => b.paymentStatus === 'completed');
    
    if (hasActiveBookings) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyUsage = days.map(day => ({
        name: day,
        hours: Math.floor(Math.random() * 8) + 1,
        visits: Math.floor(Math.random() * 3) + 1
      }));
      
      const totalHours = weeklyUsage.reduce((sum, day) => sum + day.hours, 0);
      const totalVisits = weeklyUsage.reduce((sum, day) => sum + day.visits, 0);
      
      setUsageStats({
        weeklyUsage,
        totalHoursSpent: totalHours,
        totalVisits,
        averageStayDuration: totalHours / totalVisits
      });
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  return {
    isChangeNameOpen,
    setIsChangeNameOpen,
    isChangePasswordOpen,
    setIsChangePasswordOpen,
    bookings,
    payments,
    formatDate,
    getSubscriptionEndDate,
    usageStats
  };
};
