
import axios from './axiosConfig';

export interface HostelBedData {
  _id?: string;
  number: number;
  hostelId: string;
  roomId: string;
  roomNumber: string;
  floor: string;
  isAvailable?: boolean;
  price: number;
  bedType: 'single' | 'double' | 'bunk';
  sharingType: 'private' | '2-sharing' | '3-sharing' | '4-sharing' | '5-sharing' | '6-sharing' | '8-sharing';
  sharingOptionId?: string;
  amenities?: string[];
  currentBookingId?: string;
  bookingHistory?: {
    bookingId: string;
    startDate: string;
    endDate: string;
    userId: string;
  }[];
  status?: 'available' | 'occupied' | 'unavailable';
}


// Admin operations for hostel beds
export const adminHostelBedService = {
  // Create a bed
  createBed: async (bedData: HostelBedData) => {
    const response = await axios.post('/hostel-beds', bedData);
    return response.data;
  },
  
  // Get a single bed by ID
  getBed: async (bedId: string) => {
    const response = await axios.get(`/hostel-beds/${bedId}`);
    return response.data;
  },
  
  // Update a bed
  updateBed: async (bedId: string, bedData: Partial<HostelBedData>) => {
    const response = await axios.put(`/hostel-beds/${bedId}`, bedData);
    return response.data;
  },
  
  // Delete a bed
  deleteBed: async (bedId: string) => {
    const response = await axios.delete(`/hostel-beds/${bedId}`);
    return response.data;
  },
  
  // Bulk create beds
  bulkCreateBeds: async (hostelId: string, bedsData: Omit<HostelBedData, 'hostelId'>[]) => {
    const response = await axios.post(`/hostel-beds/${hostelId}/beds/bulk`, {
      beds: bedsData
    });
    return response.data;
  },
  
  // Get bookings for a bed
  getBedBookings: async (bedId: string) => {
    const response = await axios.get(`/hostel-beds/${bedId}/bookings`);
    return response.data;
  },
  
  // Get beds for a room
  getRoomBeds: async (roomId: string) => {
    const response = await axios.get(`/hostel-beds/rooms/${roomId}/beds`);
    return response.data;
  },
  
  // Create beds for sharing type
  createSharingTypeBeds: async (roomId: string, sharingType: string, bedsCount: number, bedData: Partial<HostelBedData>) => {
    const response = await axios.post(`/hostel-beds/rooms/${roomId}/sharing-beds`, {
      sharingType,
      bedsCount,
      bedData
    });
    return response.data;
  },
  
  // Get bed statistics for a room
  getRoomBedStats: async (roomId: string) => {
    const response = await axios.get(`/hostel-beds/rooms/${roomId}/stats`);
    return response.data;
  },
  
  // Get available beds for a room
  getAvailableBeds: async (roomId: string, startDate?: string, endDate?: string) => {
    const response = await axios.get(`/hostel-beds/rooms/${roomId}/available`, {
      params: { startDate, endDate }
    });
    return response.data;
  },
  
  // Change bed availability status
  changeBedStatus: async (bedId: string, isAvailable: boolean) => {
    const response = await axios.patch(`/hostel-beds/${bedId}/status`, { isAvailable });
    return response.data;
  },
  
  // Get beds by sharing option
  getBedsBySharingOption: async (sharingOptionId: string) => {
    const response = await axios.get(`/hostel-beds/sharing-option/${sharingOptionId}`);
    return response.data;
  }
};
