import axios from './axiosConfig';
import { BookingFilters } from '@/types/BookingTypes';

export const adminBookingsService = {
  getAllBookings: async (filters?: BookingFilters) => {
    try {
      const response = await axios.get('/admin/bookings', { params: filters });
      return {
        success: true,
        data: response.data.data || response.data,
        count: response.data.count,
        totalDocs: response.data.totalDocs,
        totalPages: response.data.totalPages,
        message: response.data.message
      };
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },

  getAllTransactions: async (filters?: BookingFilters) => {
    try {
      const response = await axios.get('/admin/bookings/all/transactions', { params: filters });
      return {
        success: true,
        data: response.data.data || response.data,
        count: response.data.count,
        totalDocs: response.data.totalDocs,
        totalPages: response.data.totalPages,
        message: response.data.message
      };
    } catch (error) {
      console.error("Error fetching all bookings:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },

  
  getBookingById: async (id: string) => {
    try {
      const response = await axios.get(`/admin/bookings/${id}`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error fetching booking ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },
  
  updateBookingStatus: async (id: string, status: 'pending' | 'completed' | 'failed') => {
    try {
      const response = await axios.put(`/admin/bookings/${id}/status`, { status });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error updating booking status ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },
  
  updateBooking: async (id: string, bookingData: unknown) => {
    try {
      const response = await axios.put(`/admin/bookings/${id}`, bookingData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error updating booking ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },

   updateTransferBooking: async (id: string, bookingData: unknown) => {
    try {
      const response = await axios.put(`/admin/bookings/transfer/${id}`, bookingData);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error updating booking ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },
  
  cancelBooking: async (id: string) => {
    try {
      const response = await axios.post(`/admin/bookings/${id}/cancel`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error cancelling booking ${id}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },
  
  getBookingStats: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    try {
      const response = await axios.get(`/admin/bookings/statistics`, { params: { period } });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error fetching booking stats:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },
  

 getRevenueByTransaction: async () => {
    try {
      const response = await axios.get(`/admin/bookings/transaction-revenue`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error fetching booking stats:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },


  getRevenueReport: async (filters?: BookingFilters) => {
    try {
      const response = await axios.get(`/admin/bookings/revenue`, { params: filters });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error fetching booking stats:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },
  
  getFiltersData: async () => {
    try {
      const response = await axios.get(`/admin/bookings/filters-data`);
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error(`Error fetching booking filters data:`, error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },

  getOccupancyReports: async (params: { 
    startDate?: string; 
    endDate?: string; 
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    cabinId?: string;
  }) => {
    try {
      const endpoint = import.meta.env.VITE_OCCUPANCY_API_ENDPOINT || '/admin/bookings/occupancy';      
      const response = await axios.get(endpoint, { params });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching occupancy reports:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },

  getExpiringBookings: async (daysThreshold: number = 7) => {
    try {
      const endpoint = import.meta.env.VITE_EXPIRING_BOOKINGS_ENDPOINT || '/admin/bookings/expiring';
      
      const response = await axios.get(endpoint, { 
        params: { daysThreshold } 
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching expiring bookings:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },

  getTopFillingRooms: async (limit: number = 10) => {
    try {
      const endpoint = '/admin/bookings/top-filling-rooms';
      
      const response = await axios.get(endpoint, { 
        params: { limit } 
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching top filling rooms:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },

  getMonthlyRevenue: async (year: number = new Date().getFullYear()) => {
    try {
      const endpoint = '/admin/bookings/monthly-revenue';
      
      const response = await axios.get(endpoint, { 
        params: { year } 
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },
   getMonthlyOccupancy: async (year: number = new Date().getFullYear()) => {
    try {
      const endpoint = '/admin/bookings/monthly-occupancy';
      
      const response = await axios.get(endpoint, { 
        params: { year } 
      });
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching monthly occupancy:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  },
    getActiveResidents: async () => {
    try {
      const response = await axios.get('/admin/bookings/active-residents');
      return {
        success: true,
        data: response.data.data || response.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error fetching active residents:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  }
};
