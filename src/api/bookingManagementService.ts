
import axios from './axiosConfig';
import { BookingFilters } from '../types/BookingTypes';

interface CreateBookingData {
  cabinId?: string;
  seatId?: string;
  hostelId?: string;
  bedId?: string;
  startDate: string;
  endDate: string;
  bookingDuration?: 'daily' | 'weekly' | 'monthly';
  durationCount?: number;
  months?: number;
  totalPrice: number;
  bookingType: 'cabin' | 'hostel' | 'laundry';
}

interface LaundryBookingData {
  items: {
    icon?: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  totalAmount: number;
  pickupLocation: {
    roomNumber: string;
    block: string;
    floor: string;
    pickupTime?: string;
  };
}

export const bookingManagementService = {
  // Common booking functions
  checkAvailability: async (bookingData: Partial<CreateBookingData>) => {
    const response = await axios.post('/bookings/check-availability', bookingData);
    return response.data;
  },
  
  createBooking: async (bookingData: CreateBookingData) => {
    if (bookingData.bookingType === 'cabin') {
      const response = await axios.post('/bookings', {
        cabinId: bookingData.cabinId,
        seatId: bookingData.seatId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        bookingDuration: bookingData.bookingDuration || 'monthly',
        durationCount: bookingData.durationCount,
        months: bookingData.months,
        totalPrice: bookingData.totalPrice
      });
      return response.data;
    } else if (bookingData.bookingType === 'hostel') {
      const response = await axios.post('/hostel/bookings', {
        hostelId: bookingData.hostelId,
        bedId: bookingData.bedId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        bookingDuration: bookingData.bookingDuration || 'monthly',
        durationCount: bookingData.durationCount,
        months: bookingData.months,
        totalPrice: bookingData.totalPrice
      });
      return response.data;
    }
    
    return { success: false, message: 'Invalid booking type' };
  },
  
  getUserBookings: async (filters?: BookingFilters) => {
    const response = await axios.get('/bookings/user', { params: filters });
    return response.data;
  },
  
  getBookingById: async (bookingId: string) => {
    const response = await axios.get(`/bookings/${bookingId}`);
    return response.data;
  },
  
  cancelBooking: async (bookingId: string) => {
    const response = await axios.post(`/bookings/${bookingId}/cancel`);
    return response.data;
  },
  
  // Hostel bed booking specific functions
  getHostelBedAvailability: async (hostelId: string, startDate?: string, endDate?: string) => {
    const response = await axios.get(`/hostel/bookings/${hostelId}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
  },
  
  bookHostelBed: async (bookingData: CreateBookingData) => {
    return bookingManagementService.createBooking({
      ...bookingData,
      bookingType: 'hostel'
    });
  },
  
  // Cabin seat booking specific functions
  getCabinSeatAvailability: async (cabinId: string, startDate?: string, endDate?: string) => {
    const response = await axios.get(`/seats/cabin/${cabinId}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
  },
  
  bookCabinSeat: async (bookingData: CreateBookingData) => {
    return bookingManagementService.createBooking({
      ...bookingData,
      bookingType: 'cabin'
    });
  },
  
  // Laundry booking specific functions
  createLaundryBooking: async (laundryData: LaundryBookingData) => {
    const response = await axios.post('/laundry/orders', laundryData);
    return response.data;
  },
  
  getLaundryBookings: async (filters?: { status?: string }) => {
    const response = await axios.get('/laundry/orders/user', { 
      params: filters 
    });
    return response.data;
  },
  
  // Admin specific booking functions
  getAllBookings: async (filters?: BookingFilters) => {
    const response = await axios.get('/admin/bookings', { params: filters });
    return response.data;
  },
  
  updateBookingStatus: async (bookingId: string, status: string) => {
    const response = await axios.put(`/admin/bookings/${bookingId}/status`, { status });
    return response.data;
  },
  
  getBookingStats: async (timeframe: 'daily' | 'weekly' | 'monthly' = 'monthly') => {
    const response = await axios.get('/admin/bookings/statistics', { 
      params: { timeRange: timeframe } 
    });
    return response.data;
  },
  
  // New methods to match backend endpoints
  processPayment: async (bookingId: string, paymentMethod: string) => {
    const response = await axios.post(`/bookings/${bookingId}/payment`, { paymentMethod });
    return response.data;
  },
  
  getBookingReports: async (filters?: BookingFilters) => {
    const response = await axios.get('/bookings/reports', { params: filters });
    return response.data;
  },
  
  getCurrentBookings: async () => {
    const response = await axios.get('/bookings/user/current');
    return response.data;
  },
  
  getBookingHistory: async () => {
    const response = await axios.get('/bookings/user/history');
    return response.data;
  }
};
