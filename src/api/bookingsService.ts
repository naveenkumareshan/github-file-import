
import axios from './axiosConfig';

interface BookingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
}

interface BookingData {
  cabinId?: string;
  seatId: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  bookingDuration?: string;
  durationCount?: number;
  totalPrice?: number;
  seatPrice: number;
  isRenewal: boolean;
  keyDeposit: number;
  couponCode?: string;
  discountAmount?: number;
}

export const bookingsService = {
  createBooking: async (data: BookingData) => {
    try {
      const response = await axios.post('/bookings', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  getUserBookings: async (filters?: BookingFilters) => {
    try {
      let url = '/bookings/user';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }
      
      const response = await axios.get(url);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Add getCurrentBookings method for StudentDashboard.tsx
  getCurrentBookings: async () => {
    try {
      const response = await axios.get('/bookings/user/current');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching current bookings:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  getBookingById: async (id: string) => {
    try {
      const response = await axios.get(`/bookings/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching booking:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  updateBookingStatus: async (id: string, status: string) => {
    try {
      const response = await axios.put(`/bookings/${id}/status`, { status });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  cancelBooking: async (id: string) => {
    try {
      const response = await axios.put(`/bookings/${id}/cancel`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  extendBooking: async (id: string, newEndDate: string) => {
    try {
      const response = await axios.put(`/bookings/${id}/extend`, { newEndDate });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error extending booking:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  getBookingHistory: async () => {
    try {
      const response = await axios.get('/bookings/user/history');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching booking history:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
  
  // Add the missing method to get cabin bookings
  getCabinBookings: async (cabinId: string) => {
    try {
      const response = await axios.get(`/bookings/cabin/${cabinId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching cabin bookings:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },
    // New method for renewing bookings
  renewBooking: async (renewalData: any) => {
    const response = await axios.post(`/bookings/${renewalData.bookingId}/renew`, renewalData);
    return response.data;
  },
};
