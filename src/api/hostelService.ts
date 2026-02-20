
import axios from './axiosConfig';
import { RoomWithSharingData } from './types';

export interface HostelData {
  _id?: string;
  id?: string;
  name: string;
  location: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive: boolean;
  logoImage?: string;
  // New fields
  stayType?: 'Short-term' | 'Long-term' | 'Both';
  gender?: 'Male' | 'Female' | 'Co-ed';
  locality?: string;
  city?: string;
  amenities?: string[];
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

export const hostelService = {
  getAllHostels: async (filters?: any) => {
    const response = await axios.get('/hostels', { params: filters });
    return response.data;
  },
  
  getHostelById: async (hostelId: string) => {
    const response = await axios.get(`/hostels/${hostelId}/hostel`);
    return response.data;
  },
  
  getHostelRooms: async (hostelId: string) => {
    const response = await axios.get(`/hostels/${hostelId}/rooms`);
    return response.data;
  },
  
  getRoomById: async (roomId: string) => {
    const response = await axios.get(`/hostels/rooms/${roomId}`);
    return response.data;
  },
  
  getRoomSharingOptions: async (roomId: string) => {
    const response = await axios.get(`/rooms/${roomId}/sharing`);
    return response.data;
  },
  
  getNearbyHostels: async (lat: number, lng: number, radius: number = 10) => {
    const response = await axios.get('/hostels/nearby', { 
      params: { lat, lng, radius } 
    });
    return response.data;
  },
  
  getHostelsByCity: async (city: string) => {
    const response = await axios.get('/hostels', { 
      params: { city } 
    });
    return response.data;
  },
  
  addRoom: async (hostelId: string, roomData: RoomWithSharingData) => {
    const response = await axios.post(`/hostels/${hostelId}/rooms`, roomData);
    return response.data;
  },
  
  bookSharedRoom: async (bookingData: any) => {
    const response = await axios.post('/hostel-bookings', bookingData);
    return response.data;
  },

  bookSharedRoomUpdateTransactioId: async (bookingId: string, bookingData: any) => {
    const response = await axios.post(`/hostel-bookings/update-order/${bookingId}/order`, bookingData);
    return response.data;
  },

  // Add the missing methods
  createHostel: async (hostelData: HostelData) => {
    const response = await axios.post('/hostels', hostelData);
    return response.data;
  },

  updateHostel: async (hostelId: string, hostelData: Partial<HostelData>) => {
    const response = await axios.put(`/hostels/${hostelId}`, hostelData);
    return response.data;
  },

  deleteHostel: async (hostelId: string) => {
    const response = await axios.delete(`/hostels/${hostelId}`);
    return response.data;
  },

  uploadLogo: async (hostelId: string, logoFile: File) => {
    const formData = new FormData();
    formData.append('logo', logoFile);
    
    const response = await axios.post(`/hostels/${hostelId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  // Add the missing getUserHostels method
  getUserHostels: async () => {
    const response = await axios.get('/hostels/my-hostels');
    return response.data;
  },
  
  // Add booking related methods
  getAllBookings: async (params?: any) => {
    const response = await axios.get('/hostel-bookings/admin/current', { params });
    return response.data;
  },
  
  getBookingById: async (bookingId: string) => {
    const response = await axios.get(`/hostel-bookings/${bookingId}`);
    return response.data;
  },
  
  getUserBookings: async () => {
    const response = await axios.get('/hostel-bookings/user');
    return response.data;
  },
  
  cancelBooking: async (bookingId: string) => {
    const response = await axios.post(`/hostel-bookings/${bookingId}/cancel`);
    return response.data;
  },
  
  getBookingStats: async (hostelId?: string) => {
    const params = hostelId ? { hostelId } : {};
    const response = await axios.get('/hostel-bookings/stats', { params });
    return response.data;
  }
};

export type { RoomWithSharingData };
