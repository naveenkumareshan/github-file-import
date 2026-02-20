
import axios from './axiosConfig';

export interface VendorSeat {
  _id: string;
  number: number;
  cabinId: string;
  cabinName: string;
  position: { x: number; y: number };
  isAvailable: boolean;
  isHotSelling: boolean;
  price: number;
  unavailableUntil?: string;
  currentBooking?: any;
}

export interface VendorCabin {
  _id: string;
  name: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
}

export interface SeatFilters {
  cabinId?: string;
  status?: 'all' | 'available' | 'occupied' | 'hot-selling';
  search?: string;
}

export const vendorSeatsService = {
  // Get all vendor cabins
  getVendorCabins: async () => {
    try {
      const response = await axios.get('/vendor/cabins');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get seats for vendor with filters
  getVendorSeats: async (filters?: SeatFilters) => {
    try {
      const response = await axios.get('/vendor/seats', { params: filters });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get seats for specific cabin
  getCabinSeats: async (cabinId: string) => {
    try {
      const response = await axios.get(`/vendor/cabins/${cabinId}/seats`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Update seat price
  updateSeatPrice: async (seatId: string, price: number) => {
    try {
      const response = await axios.put(`/vendor/seats/${seatId}/price`, { price });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Toggle seat availability
  toggleSeatAvailability: async (seatId: string, isAvailable: boolean) => {
    try {
      const response = await axios.put(`/vendor/seats/${seatId}/availability`, { isAvailable });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Mark seat as hot selling
  toggleHotSelling: async (seatId: string, isHotSelling: boolean) => {
    try {
      const response = await axios.put(`/vendor/seats/${seatId}/hot-selling`, { isHotSelling });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Get seat booking details
  getSeatBookingDetails: async (seatId: string) => {
    try {
      const response = await axios.get(`/vendor/seats/${seatId}/booking`);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
