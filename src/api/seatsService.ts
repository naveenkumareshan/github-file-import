import axios from './axiosConfig';

export interface SeatAvailabilityCheck {
  seatId: string;
  startDate: string;
  endDate: string;
}

export interface SeatAvailabilityResponse {
  seatId: string;
  price:string;
  cabinName:string;
  cabinCode:string;
  number:number,
  unavailableUntil:string;
  isAvailable: boolean;
  conflictingBookings?: {
    bookingId: string;
    startDate: any;
    endDate: any;
    status: string;
    userId:any;
    seatId:any;
    cabinId:any;
  }[];
}

export const seatsService = {
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
  
  getSeatsByCabin: async (cabinId: string, floor: number) => {
    const response = await axios.get(`/seats/cabin/${cabinId}/${floor}`);
    return response.data;
  },
  
  getSeatById: async (id: string) => {
    const response = await axios.get(`/seats/${id}`);
    return response.data;
  },
  
  createSeat: async (data: any) => {
    const response = await axios.post('/seats', data);
    return response.data;
  },
  
  updateSeat: async (id: string, data: any) => {
    const response = await axios.put(`/seats/${id}`, data);
    return response.data;
  },
  
  deleteSeat: async (id: string) => {
    const response = await axios.delete(`/seats/${id}`);
    return response.data;
  },
  
  bulkCreateSeats: async (seats: any[]) => {
    const response = await axios.post('/seats/bulk-create', { seats });
    return response.data;
  },
  
  bulkUpdateSeats: async (seats: any[]) => {
    const response = await axios.post('/seats/bulk-update', { seats });
    return response.data;
  },

  // New method to update seat positions
  updateSeatPositions: async (seats: any[]) => {
    const updates = seats.map(seat => ({
      _id: seat._id,
      updates: { position: seat.position }
    }));
    
    return await seatsService.bulkUpdateSeats(updates);
  },
  
  // Check availability for specific date range
  checkSeatAvailability: async (seatId: string, startDate: string, endDate: string): Promise<{ success: boolean; data: SeatAvailabilityResponse }> => {
    const response = await axios.get(`/seats/${seatId}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Check availability for multiple seats in a date range
  checkSeatsAvailabilityBulk: async (cabinId: string, startDate: string, endDate: string): Promise<{ success: boolean; data: SeatAvailabilityResponse[] }> => {
    const response = await axios.post('/seats/check-availability-bulk', {
      cabinId,
      startDate,
      endDate
    });
    return response.data;
  },

  // Get seats filtered by availability for date range
  getAvailableSeatsForDateRange: async (cabinId: string, floor: string, startDate: string, endDate: string) => {
    const response = await axios.get(`/seats/cabin/${cabinId}/floor/${floor}/available`, {
      params: { startDate, endDate }
    });
    return response.data;
  }
};
