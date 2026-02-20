
import axios from './axiosConfig';

export interface SharingOption {
  total: number;
  available: number;
  price: number;
  sharingCapacity: number;
}

export interface RoomSharingData {
  roomId: string;
  roomName: string;
  roomType?: string;
  hostelId?: string;
  sharingOptions: {
    [key: string]: SharingOption;
  };
}

export interface HostelAvailability {
  hostel: any;
  roomsAvailability: {
    roomId: string;
    roomName: string;
    roomType: string;
    sharingAvailability: {
      [key: string]: {
        total: number;
        available: number;
        capacity: number;
        price: number;
      }
    }
  }[];
}

export const roomSharingService = {
  getRoomSharingOptions: async (roomId: string): Promise<RoomSharingData> => {
    const response = await axios.get(`/room-sharing/rooms/${roomId}/sharing`);
    return response.data.data;
  },
  
  getAllSharingOptions: async (hostelId?: string): Promise<RoomSharingData[]> => {
    const params = hostelId ? { hostelId } : {};
    const response = await axios.get('/room-sharing/rooms/sharing-options', { params });
    return response.data.data;
  },
  
  getHostelAvailability: async (hostelId: string): Promise<HostelAvailability> => {
    const response = await axios.get(`/hostels/${hostelId}/availability`);
    return response.data.data;
  },
  
  bookSharedRoom: async (roomId: string, sharingType: string, data: any) => {
    try {
      // First get available seat of specified sharing type
      const response = await axios.get(`/seats/cabin/${roomId}`, {
        params: { sharingType, available: true, limit: 1 }
      });
      
      if (!response.data.data || response.data.data.length === 0) {
        throw new Error("No available seats for this room with selected sharing type");
      }
      
      // Use the first available seat
      const seatId = response.data.data[0]._id;
      
      // Create booking with this seat
      const bookingData = {
        ...data,
        seatId: seatId,
        cabinId: roomId
      };
      
      const bookingResponse = await axios.post('/bookings', bookingData);
      return bookingResponse.data;
    } catch (error) {
      console.error('Error booking shared room:', error);
      throw error;
    }
  }
};
