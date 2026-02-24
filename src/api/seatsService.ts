import { supabase } from '@/integrations/supabase/client';

export interface SeatAvailabilityResponse {
  seatId: string;
  price: string;
  cabinName: string;
  cabinCode: string;
  number: number;
  unavailableUntil: string;
  isAvailable: boolean;
  conflictingBookings?: any[];
}

const mapRow = (row: any): any => ({
  _id: row.id,
  id: row.id,
  number: row.number,
  floor: row.floor,
  cabinId: row.cabin_id,
  price: row.price,
  position: { x: row.position_x, y: row.position_y },
  isAvailable: row.is_available,
  isHotSelling: row.is_hot_selling,
  unavailableUntil: row.unavailable_until,
  sharingType: row.sharing_type,
  sharingCapacity: row.sharing_capacity,
  category: row.category,
});

export const seatsService = {
  getAllSeats: async (filters: any = {}) => {
    try {
      let query = supabase.from('seats').select('*');
      if (filters.cabinId) query = query.eq('cabin_id', filters.cabinId);
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: (data || []).map(mapRow) };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getAdminAllSeats: async (filters: any = {}) => {
    return seatsService.getAllSeats(filters);
  },

  getActiveSeatsCountSeats: async (filters: any = {}) => {
    try {
      let query = supabase.from('seats').select('id', { count: 'exact' }).eq('is_available', true);
      if (filters.cabinId) query = query.eq('cabin_id', filters.cabinId);
      const { count, error } = await query;
      if (error) throw error;
      return { success: true, count: count || 0 };
    } catch (e) {
      return { success: false, count: 0 };
    }
  },

  getSeatsByCabin: async (cabinId: string, floor: number) => {
    try {
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('cabin_id', cabinId)
        .eq('floor', floor)
        .order('number');
      if (error) throw error;
      return { success: true, data: (data || []).map(mapRow) };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getSeatById: async (id: string) => {
    try {
      const { data, error } = await supabase.from('seats').select('*').eq('id', id).single();
      if (error) throw error;
      return { success: true, data: mapRow(data) };
    } catch (e) {
      return { success: false, data: null };
    }
  },

  createSeat: async (seatData: any) => {
    try {
      const { data, error } = await supabase.from('seats').insert({
        number: seatData.number,
        floor: seatData.floor || 1,
        cabin_id: seatData.cabinId,
        price: seatData.price,
        position_x: seatData.position?.x || 0,
        position_y: seatData.position?.y || 0,
        is_available: seatData.isAvailable ?? true,
      }).select().single();
      if (error) throw error;
      return { success: true, data: mapRow(data) };
    } catch (e) {
      return { success: false, data: null };
    }
  },

  updateSeat: async (id: string, updates: any) => {
    try {
      const updateData: any = {};
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.isAvailable !== undefined) updateData.is_available = updates.isAvailable;
      if (updates.position) {
        updateData.position_x = updates.position.x;
        updateData.position_y = updates.position.y;
      }
      const { data, error } = await supabase.from('seats').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data: mapRow(data) };
    } catch (e) {
      return { success: false, data: null };
    }
  },

  deleteSeat: async (id: string) => {
    try {
      const { error } = await supabase.from('seats').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  bulkCreateSeats: async (seats: any[]) => {
    try {
      const records = seats.map(s => ({
        number: s.number,
        floor: s.floor || 1,
        cabin_id: s.cabinId,
        price: s.price,
        position_x: s.position?.x || 0,
        position_y: s.position?.y || 0,
        is_available: s.isAvailable ?? true,
      }));
      const { data, error } = await supabase.from('seats').insert(records).select();
      if (error) throw error;
      return { success: true, data: (data || []).map(mapRow) };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  bulkUpdateSeats: async (seats: any[]) => {
    try {
      for (const s of seats) {
        await seatsService.updateSeat(s._id, s.updates || s);
      }
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  updateSeatPositions: async (seats: any[]) => {
    try {
      for (const seat of seats) {
        await supabase.from('seats').update({
          position_x: seat.position.x,
          position_y: seat.position.y,
        }).eq('id', seat._id);
      }
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  checkSeatAvailability: async (seatId: string, startDate: string, endDate: string) => {
    try {
      // Check if seat exists
      const { data: seat, error: seatError } = await supabase
        .from('seats').select('*').eq('id', seatId).single();
      if (seatError) throw seatError;

      // Check for conflicting bookings
      const { data: conflicts, error: bookError } = await supabase
        .from('bookings')
        .select('*')
        .eq('seat_id', seatId)
        .eq('payment_status', 'completed')
        .lte('start_date', endDate)
        .gte('end_date', startDate);
      if (bookError) throw bookError;

      return {
        success: true,
        data: {
          seatId: seat.id,
          price: String(seat.price),
          number: seat.number,
          isAvailable: seat.is_available && (!conflicts || conflicts.length === 0),
          conflictingBookings: conflicts || [],
        },
      };
    } catch (e) {
      return { success: false, data: null };
    }
  },

  checkSeatsAvailabilityBulk: async (cabinId: string, startDate: string, endDate: string) => {
    try {
      const { data: seats, error } = await supabase
        .from('seats').select('*').eq('cabin_id', cabinId);
      if (error) throw error;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('seat_id')
        .eq('cabin_id', cabinId)
        .eq('payment_status', 'completed')
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      const bookedSeatIds = new Set((bookings || []).map(b => b.seat_id));

      return {
        success: true,
        data: (seats || []).map(s => ({
          seatId: s.id,
          price: String(s.price),
          number: s.number,
          isAvailable: s.is_available && !bookedSeatIds.has(s.id),
        })),
      };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getAvailableSeatsForDateRange: async (cabinId: string, floor: string, startDate: string, endDate: string) => {
    try {
      // Fetch ALL seats for this cabin/floor (not just available ones)
      const { data: seats, error } = await supabase
        .from('seats')
        .select('*')
        .eq('cabin_id', cabinId)
        .eq('floor', parseInt(floor) || 1)
        .order('number');
      if (error) throw error;

      // Fetch conflicting bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('seat_id')
        .eq('cabin_id', cabinId)
        .eq('payment_status', 'completed')
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      const bookedSeatIds = new Set((bookings || []).map(b => b.seat_id));

      // Return ALL seats, marking booked ones as unavailable
      return {
        success: true,
        data: (seats || []).map(s => ({
          ...mapRow(s),
          isAvailable: s.is_available && !bookedSeatIds.has(s.id),
        })),
      };
    } catch (e) {
      return { success: false, data: [] };
    }
  },
};
