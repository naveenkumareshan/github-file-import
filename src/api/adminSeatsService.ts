
import axios from './axiosConfig';

// Define the shape of a seat's position
interface SeatPosition {
  x: number;
  y: number;
}

export interface SeatData {
  _id?: string;
  id?: string;
  number: number;
  floor : number;
  cabinId: string;
  price: number;
  position: SeatPosition;
  isAvailable: boolean;
  isHotSelling?: boolean;
  unavailableUntil?: string;
  sharingType?: string;
  sharingCapacity?: number;
}

export const adminSeatsService = {
  getAllSeats: async (filters = {}) => {
    const response = await axios.get('/seats', { params: filters });
    return response.data;
  },

  getAdminAllSeats: async (filters = {}) => {
    const response = await axios.get('/seats/get', { params: filters });
    return response.data;
  },


  getActiveSeatsCountSeats: async (filters = {}) => {
    const response = await axios.get('/seats/get/count', { params: filters });
    return response.data;
  },
  
  getSeatsByCabin: async (cabinId: string, selectedFloor:string) => {
    const response = await axios.get(`/seats/cabin/${cabinId}/${selectedFloor}?includeBookingInfo=true`);
    return response.data;
  },
  
  getSeatById: async (id: string) => {
    const response = await axios.get(`/seats/${id}`);
    return response.data;
  },
  
  createSeat: async (data: SeatData) => {
    const response = await axios.post('/seats', data);
    return response.data;
  },
  
  updateSeat: async (id: string, data: Partial<SeatData>) => {
    const response = await axios.put(`/seats/${id}`, data);
    return response.data;
  },
  
  deleteSeat: async (id: string) => {
    const response = await axios.delete(`/seats/${id}`);
    return response.data;
  },
  
  bulkCreateSeats: async (seats: SeatData[]) => {
    const response = await axios.post('/seats/bulk-create', { seats });
    return response.data;
  },
  
  bulkUpdateSeats: async (seats: {_id: string, updates: Partial<SeatData>}[]) => {
    const response = await axios.post('/seats/bulk-update', { seats });
    return response.data;
  },

  // New method to update seat positions
  updateSeatPositions: async (seats: {_id: string, position: SeatPosition}[]) => {
    const updates = seats.map(seat => ({
      _id: seat._id,
      updates: { position: seat.position }
    }));
    
    return await adminSeatsService.bulkUpdateSeats(updates);
  }
};
