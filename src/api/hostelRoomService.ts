
import axios from './axiosConfig';

export interface HostelRoomData {
  _id?: string;
  id?: string;
  name: string;
  roomNumber: string;
  description: string;
  floor: string;
  category: 'standard' | 'premium' | 'luxury';
  basePrice: number;
  maxCapacity: number;
  imageSrc?: string;
  images?: string[];  // Added this field for multiple images
  isActive: boolean;
  amenities?: string[];
  hostelId: string;
  sharingOptions: {
    bedIds?: unknown;
    type: string;
    capacity: number;
    count: number;
    price: number;
    available?: number;
  }[];
  beds?: unknown;
}

export const hostelRoomService = {
  // Get all rooms for a hostel
  getHostelRooms: async (hostelId: string) => {
    const response = await axios.get(`/hostels/${hostelId}/rooms`);
    return response.data;
  },
  
  // Get a single room
  getRoom: async (roomId: string) => {
    const response = await axios.get(`/hostel-rooms/${roomId}`);
    return response.data;
  },
  
  // Create a new room
  createRoom: async (hostelId: string, roomData: Omit<HostelRoomData, 'hostelId'>) => {
    const response = await axios.post(`/hostels/${hostelId}/rooms`, {
      ...roomData,
      hostelId
    });
    return response.data;
  },
  
  // Update a room
  updateRoom: async (roomId: string, roomData: Partial<HostelRoomData>) => {
    const response = await axios.put(`/hostel-rooms/${roomId}`, roomData);
    return response.data;
  },
  
  // Delete a room
  deleteRoom: async (roomId: string) => {
    const response = await axios.delete(`/hostel-rooms/${roomId}`);
    return response.data;
  },
  
  // Get room statistics for a hostel
  getRoomStats: async (hostelId: string) => {
    const response = await axios.get(`/hostels/${hostelId}/rooms/stats`);
    return response.data;
  }
};
