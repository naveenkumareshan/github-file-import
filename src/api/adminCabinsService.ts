import axios from './axiosConfig';

interface CabinData {
  name: string;
  description: string;
  price: number;
  capacity?: number;
  amenities?: string[];
  imageSrc?: string;
  images?: string[];
  category: 'standard' | 'premium' | 'luxury';
  serialNumber?: string;
  isActive?: boolean;
  hostelId?: string;
}

interface RoomElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
}

export const adminCabinsService = {
  getAllCabins: async (filters = {}) => {
    // This will get all cabins including inactive ones for admin purposes
    const response = await axios.get('/cabins/list/all', { 
      params: { ...filters, includeInactive: true } 
    });
    return response.data;
  },
  
  getCabinById: async (id: string) => {
    const response = await axios.get(`/cabins/${id}`);
    return response.data;
  },
  
  createCabin: async (data: CabinData) => {
    const response = await axios.post('/cabins', data);
    return response.data;
  },
  
  updateCabin: async (id: string, data: Partial<CabinData>) => {
    const response = await axios.put(`/cabins/${id}`, data);
    return response.data;
  },

  addUpdateCabinFloor: async (id: string, data: { floorId: number, number: string }) => {
    const response = await axios.put(`/cabins/${id}/floors`, data);
    return response.data;
  },
    
  deleteCabin: async (id: string) => {
    // This will soft-delete the cabin (mark as inactive)
    const response = await axios.delete(`/cabins/${id}`);
    return response.data;
  },
  
  restoreCabin: async (id: string) => {
    // This will restore a soft-deleted cabin (mark as active)
    const response = await axios.put(`/cabins/${id}/restore`, { isActive: true });
    return response.data;
  },
  
  getCabinStats: async () => {
    const response = await axios.get('/cabins/stats');
    return response.data;
  },
  
  bulkUpdateCabins: async (cabins: {id: string, updates: Partial<CabinData>}[]) => {
    const response = await axios.post('/cabins/bulk-update', { cabins });
    return response.data;
  },
  
  // New methods for handling cabin images
  uploadCabinImage: async (cabinId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(`/cabins/${cabinId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  uploadCabinImages: async (cabinId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    const response = await axios.post(`/cabins/${cabinId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  removeCabinImage: async (cabinId: string, imageUrl: string) => {
    const filename = imageUrl.split('/').pop();
    const response = await axios.delete(`/cabins/${cabinId}/image/${filename}`);
    return response.data;
  },
  
  // New methods for cabin seats
  getCabinWithSeats: async (cabinId: string) => {
    const response = await axios.get(`/cabins/${cabinId}/with-seats`);
    return response.data;
  },
  
  getCabinSeatStats: async (cabinId: string) => {
    const response = await axios.get(`/cabins/${cabinId}/seat-stats`);
    return response.data;
  },
  
  getCabinBookingStats: async (cabinId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    const response = await axios.get(`/cabins/${cabinId}/booking-stats`, {
      params: { period }
    });
    return response.data;
  },
  
  updateCabinLayout: async (cabinId: string, roomElements: RoomElement[]) => {
    try {
      const response = await axios.put(`/cabins/${cabinId}/room-layout`, { roomElements });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error updating cabin layout:', error);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
};
