
import axios from './axiosConfig';

export interface RoomData {
  name: string;
  description: string;
  price: number;
  capacity?: number;
  amenities?: string[];
  imageSrc?: string;
  category: 'standard' | 'premium' | 'luxury';
  serialNumber?: string;
  isActive?: boolean;
}

export const adminRoomsService = {
  getAllRooms: async (filters = {}) => {
    const response = await axios.get('/admin/rooms', { params: filters });
    return response.data;
  },
  
  getRoomById: async (id: string) => {
    const response = await axios.get(`/admin/rooms/${id}`);
    return response.data;
  },
  
  createRoom: async (data: RoomData) => {
    const response = await axios.post('/admin/rooms', data);
    return response.data;
  },
  
  updateRoom: async (id: string, data: Partial<RoomData>) => {
    const response = await axios.put(`/admin/rooms/${id}`, data);
    return response.data;
  },
  
  deleteRoom: async (id: string) => {
    const response = await axios.delete(`/admin/rooms/${id}`);
    return response.data;
  },
  
  restoreRoom: async (id: string, type:string, status:boolean) => {
    const response = await axios.put(`/admin/rooms/${id}/restore`, { isActive: status, type });
    return response.data;
  },
  
  uploadRoomImage: async (roomId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(`/admin/rooms/${roomId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  getRoomStats: async () => {
    const response = await axios.get('/admin/rooms/stats');
    return response.data;
  },
  
  bulkUpdateRooms: async (rooms: {id: string, updates: Partial<RoomData>}[]) => {
    const response = await axios.post('/admin/rooms/bulk-update', { rooms });
    return response.data;
  }
};
