
import axios from './axiosConfig';

export const hostelManagerService = {
  // Get cabins managed by the logged-in hostel manager
  getManagedCabins: async (filters = {}) => {
    try {
      const response = await axios.get('/manager/cabins/managed', { params: filters });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching managed cabins:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  // Get revenue statistics for cabins managed by the logged-in hostel manager
  getCabinRevenueStats: async (period = 'month') => {
    try {
      const response = await axios.get('/manager/cabins/managed/revenue', { 
        params: { period } 
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching cabin revenue stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  // Get booking statistics for cabins managed by the logged-in hostel manager
  getCabinBookingStats: async (period = 'month') => {
    try {
      const response = await axios.get('/manager/cabins/managed/bookings-stats', { 
        params: { period } 
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching cabin booking stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  // Get seat statistics for cabins managed by the logged-in hostel manager
  getCabinSeatsStats: async () => {
    try {
      const response = await axios.get('/manager/cabins/managed/seats-stats');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching cabin seats stats:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
};
