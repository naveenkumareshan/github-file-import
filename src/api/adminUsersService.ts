
import axios from './axiosConfig';

interface UserFilters {
  status?: 'pending' | 'completed' | 'failed';
  role?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  includeInactive?: boolean;
}

interface BookingFilters {
  status?: 'pending' | 'completed' | 'failed';
  endDate?: string;
  cabinId?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface BookingUpdateData {
  paymentStatus?: 'pending' | 'completed' | 'failed';
  status?: 'pending' | 'completed' | 'failed'; 
  startDate?: string;
  endDate?: string;
  months?: number;
  totalPrice?: number;
}

interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  isActive?: boolean;
  address?: string;
  bio?: string;
  courseStudying?: string;
  collegeStudied?: string;
  parentMobileNumber?: string;
}

export const adminUsersService = {

  getUsers: async (filters?: UserFilters) => {
    const response = await axios.get('/admin/users', { params: filters });
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await axios.get(`/admin/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, userData: UserUpdateData) => {
    const response = await axios.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  getBookingsByUserId: async (filters?: BookingFilters) => {
    const response = await axios.get('/admin/users/bookings', { params: filters });
    return response.data;
  },
  
  getBookingById: async (id: string) => {
    const response = await axios.get(`/admin/bookings/${id}`);
    return response.data;
  },
  
  updateBooking: async (id: string, data: BookingUpdateData) => {
    const response = await axios.put(`/admin/bookings/${id}`, data);
    return response.data;
  },
  
  cancelBooking: async (id: string) => {
    const response = await axios.post(`/admin/bookings/${id}/cancel`);
    return response.data;
  },
  
  // Reports and analytics
  getBookingReports: async (filters?: BookingFilters) => {
    const response = await axios.get('/admin/bookings/reports', { params: filters });
    return response.data;
  },
  
  getBookingStatistics: async (timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const response = await axios.get('/admin/bookings/statistics', { 
      params: { timeRange } 
    });
    return response.data;
  },
  
  getOccupancyRates: async (timeRange?: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const response = await axios.get('/admin/bookings/occupancy', { 
      params: { timeRange } 
    });
    return response.data;
  },
  
  getRevenueReports: async (filters?: BookingFilters) => {
    const response = await axios.get('/admin/bookings/revenue', { params: filters });
    return response.data;
  }
};
