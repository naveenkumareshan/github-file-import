
import { supabase } from '@/integrations/supabase/client';

export interface VendorSeat {
  _id: string;
  number: number;
  cabinId: string;
  cabinName: string;
  position: { x: number; y: number };
  isAvailable: boolean;
  isHotSelling: boolean;
  price: number;
  category: string;
  floor: number;
  unavailableUntil?: string;
  currentBooking?: {
    startDate: string;
    endDate: string;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    profilePicture: string;
    userId: string;
  };
}

export interface VendorCabin {
  _id: string;
  name: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
  floors?: any[];
}

export interface SeatFilters {
  cabinId?: string;
  status?: 'available' | 'occupied' | 'hot-selling';
  search?: string;
}

export const vendorSeatsService = {
  // Get all cabins (filtered by RLS for partners)
  getVendorCabins: async () => {
    try {
      const { data: cabins, error } = await supabase
        .from('cabins')
        .select('*')
        .order('name');

      if (error) throw error;

      // Get seat counts per cabin
      const { data: seats, error: seatsError } = await supabase
        .from('seats')
        .select('cabin_id, is_available');

      if (seatsError) throw seatsError;

      const cabinData = (cabins || []).map(cabin => {
        const cabinSeats = (seats || []).filter(s => s.cabin_id === cabin.id);
        return {
          _id: cabin.id,
          name: cabin.name,
          location: cabin.full_address || '',
          totalSeats: cabinSeats.length,
          availableSeats: cabinSeats.filter(s => s.is_available).length,
          occupiedSeats: cabinSeats.filter(s => !s.is_available).length,
          floors: cabin.floors || [],
        };
      });

      return { success: true, data: { data: cabinData } };
    } catch (error) {
      console.error('Error fetching vendor cabins:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Get seats with filters and booking info
  getVendorSeats: async (filters?: SeatFilters) => {
    try {
      let query = supabase
        .from('seats')
        .select('*, cabins!inner(id, name)')
        .order('number');

      if (filters?.cabinId) {
        query = query.eq('cabin_id', filters.cabinId);
      }

      if (filters?.status === 'available') {
        query = query.eq('is_available', true);
      } else if (filters?.status === 'occupied') {
        query = query.eq('is_available', false);
      } else if (filters?.status === 'hot-selling') {
        query = query.eq('is_hot_selling', true);
      }

      const { data: seatsData, error } = await query;
      if (error) throw error;

      // Get active bookings for these seats
      const seatIds = (seatsData || []).map(s => s.id);
      const today = new Date().toISOString().split('T')[0];
      
      let bookingsMap: Record<string, any> = {};
      if (seatIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*, profiles:user_id(name, email, phone, profile_picture, serial_number)')
          .in('seat_id', seatIds)
          .eq('payment_status', 'completed')
          .gte('end_date', today)
          .lte('start_date', today);

        (bookings || []).forEach(b => {
          const profile = b.profiles as any;
          bookingsMap[b.seat_id!] = {
            startDate: b.start_date,
            endDate: b.end_date,
            studentName: profile?.name || 'N/A',
            studentEmail: profile?.email || 'N/A',
            studentPhone: profile?.phone || 'N/A',
            profilePicture: profile?.profile_picture || '',
            userId: profile?.serial_number || '',
          };
        });
      }

      const mappedSeats: VendorSeat[] = (seatsData || []).map(seat => ({
        _id: seat.id,
        number: seat.number,
        cabinId: seat.cabin_id,
        cabinName: (seat.cabins as any)?.name || '',
        position: { x: Number(seat.position_x), y: Number(seat.position_y) },
        isAvailable: seat.is_available,
        isHotSelling: seat.is_hot_selling,
        price: Number(seat.price),
        category: seat.category,
        floor: seat.floor,
        unavailableUntil: seat.unavailable_until || undefined,
        currentBooking: bookingsMap[seat.id] || undefined,
      }));

      return { success: true, data: { data: mappedSeats } };
    } catch (error) {
      console.error('Error fetching vendor seats:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Get seats for specific cabin
  getCabinSeats: async (cabinId: string) => {
    return vendorSeatsService.getVendorSeats({ cabinId });
  },

  // Update seat price
  updateSeatPrice: async (seatId: string, price: number) => {
    try {
      const { error } = await supabase
        .from('seats')
        .update({ price })
        .eq('id', seatId);
      if (error) throw error;
      return { success: true, data: {} };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Toggle seat availability
  toggleSeatAvailability: async (seatId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('seats')
        .update({ is_available: isAvailable })
        .eq('id', seatId);
      if (error) throw error;
      return { success: true, data: {} };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Mark seat as hot selling
  toggleHotSelling: async (seatId: string, isHotSelling: boolean) => {
    try {
      const { error } = await supabase
        .from('seats')
        .update({ is_hot_selling: isHotSelling })
        .eq('id', seatId);
      if (error) throw error;
      return { success: true, data: {} };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Get seat booking details
  getSeatBookingDetails: async (seatId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles:user_id(name, email, phone, profile_picture)')
        .eq('seat_id', seatId)
        .eq('payment_status', 'completed')
        .gte('end_date', today)
        .lte('start_date', today)
        .maybeSingle();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  }
};

export const partnerSeatsService = vendorSeatsService;
