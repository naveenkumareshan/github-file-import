
import axios from './axiosConfig';

// Define BookingType to match our ManualBookingManagement component
type BookingType = 'cabin' | 'hostel';

export const adminManualBookingService = {
  // Create manual cabin booking
  createManualCabinBooking: async (bookingData: any) => {
    try {
      const response = await axios.post('/admin/manual-bookings/manual/cabin', bookingData);
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        'Failed to create manual cabin booking';
      console.error('Manual cabin booking error:', message);
      return { success: false, error: message };
    }
  },

  // Create manual hostel booking
  createManualHostelBooking: async (bookingData: any) => {
    try {
      const response = await axios.post('/admin/manual-bookings/manual/hostel', bookingData);
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        'Failed to create manual hostel booking';
      console.error('Manual hostel booking error:', message);
      return { success: false, error: message };
    }
  },

  // Extend booking validity
  extendBooking: async (bookingId: string,  extendData: any, bookingType: BookingType) => {
    try {
      const response = await axios.put(
        `/admin/manual-bookings/${bookingId}/extend?bookingType=${bookingType}`, 
        extendData
      );
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        'Failed to extend booking';
      console.error('Extend booking error:', message);
      return { success: false, error: message };
    }
  },

  updateBookingData: async (bookingId: string,  extendData: any, bookingType: BookingType) => {
    try {
      const response = await axios.put(
        `/admin/manual-bookings/${bookingId}/update-data?bookingType=${bookingType}`, 
        extendData
      );
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        'Failed to extend booking';
      console.error('Extend booking error:', message);
      return { success: false, error: message };
    }
  },
  // Record manual payment
  recordManualPayment: async (bookingId: string, bookingType: BookingType, paymentData: any) => {
    try {
      const response = await axios.post(
        `/admin/manual-bookings/${bookingId}/payment?bookingType=${bookingType}`, 
        paymentData
      );
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        'Failed to record payment';
      console.error('Record payment error:', message);
      return { success: false, error: message };
    }
  },

  // Get booking details
  getBookingDetails: async (bookingId: string, bookingType: BookingType) => {
    try {
      const response = await axios.get(
        `/admin/manual-bookings/${bookingId}/details?bookingType=${bookingType}`
      );
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        'Failed to get booking details';
      console.error('Get booking details error:', message);
      return { success: false, error: message };
    }
  }
};
