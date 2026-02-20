
import axios from './axiosConfig';

export interface RoomRestriction {
  _id: string;
  cabinId: any;
  roomId?: string;
  restrictionType: 'date' | 'time' | 'capacity';
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomRestrictionData {
  cabinId: string;
  roomId?: string;
  restrictionType: 'date' | 'time' | 'capacity';
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
}

export interface RoomRestrictionFilters {
  cabinId?: string;
  restrictionType?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const roomRestrictionService = {
  // Get restrictions with pagination and filters
  getRestrictions: async (page = 1, limit = 20, filters: RoomRestrictionFilters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(`/admin/room-restrictions?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching restrictions:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Create restriction
  createRestriction: async (restrictionData: RoomRestrictionData) => {
    try {
      const response = await axios.post('/admin/room-restrictions', restrictionData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating restriction:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update restriction
  updateRestriction: async (restrictionId: string, restrictionData: Partial<RoomRestrictionData>) => {
    try {
      const response = await axios.put(`/admin/room-restrictions/${restrictionId}`, restrictionData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating restriction:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Delete restriction
  deleteRestriction: async (restrictionId: string) => {
    try {
      const response = await axios.delete(`/admin/room-restrictions/${restrictionId}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error deleting restriction:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Toggle restriction status
  toggleRestrictionStatus: async (restrictionId: string) => {
    try {
      const response = await axios.patch(`/admin/room-restrictions/${restrictionId}/toggle`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error toggling restriction status:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
