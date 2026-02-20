
import axios from './axiosConfig';

export interface CabinFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  amenities?: string;
  sortBy?: 'distance' | 'price' | 'rating' | 'name';
}

interface RoomElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
}

export const cabinsService = {
  getAllCabins: async (filters?: CabinFilters) => {
    try {
      const response = await axios.get('/cabins/filter', { params: filters });
      return {
        success: true,
        data: response.data.data || response.data,
        count: response.data.total || 0,
        totalPages: response.data.pagination?.next?.page || 1
      };
    } catch (error) {
      console.error('Error fetching cabins:', error);
      return {
        success: false,
        error,
        data: [],
        count: 0,
        totalPages: 1
      };
    }
  },
  getAllCabinsWithOutFilter: async (filters?: CabinFilters) => {
    try {
      const response = await axios.get('/cabins/for-reviews/all', { params: filters });
      return {
        success: true,
        data: response.data.data || response.data,
        count: response.data.total || 0,
        totalPages: response.data.pagination?.next?.page || 1
      };
    } catch (error) {
      console.error('Error fetching cabins:', error);
      return {
        success: false,
        error,
        data: [],
        count: 0,
        totalPages: 1
      };
    }
  },
  
  
  getFeaturedCabins: async () => {
    try {
      const response = await axios.get('/cabins/featured-cabins');
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Error fetching featured cabins:', error);
      return {
        success: false,
        error,
        data: []
      };
    }
  },
  
  getCabinById: async (id: string) => {
    try {
      const response = await axios.get(`/cabins/${id}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error(`Error fetching cabin with id ${id}:`, error);
      return {
        success: false,
        error
      };
    }
  },
  
  getCabinsByCategory: async (category: string) => {
    try {
      const response = await axios.get(`/cabins/category/${category}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error(`Error fetching cabins in category ${category}:`, error);
      return {
        success: false,
        error,
        data: []
      };
    }
  }
};
