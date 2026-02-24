
import { supabase } from '@/integrations/supabase/client';

export interface SeatBookingDetail {
  bookingId: string;
  serialNumber: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  paymentStatus: string;
  bookingDuration: string;
  durationCount: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentSerialNumber: string;
  profilePicture: string;
  course: string;
  college: string;
  address: string;
  city: string;
  state: string;
  gender: string;
  dob: string;
  userId: string;
  lockerIncluded?: boolean;
  lockerPrice?: number;
  discountAmount?: number;
  discountReason?: string;
  paymentMethod?: string;
  collectedByName?: string;
  transactionId?: string;
}

export interface VendorSeat {
  _id: string;
  number: number;
  cabinId: string;
  cabinName: string;
  position: { x: number; y: number };
  isAvailable: boolean;
  price: number;
  category: string;
  floor: number;
  unavailableUntil?: string;
  dateStatus?: 'available' | 'booked' | 'expiring_soon' | 'blocked';
  currentBooking?: {
    startDate: string;
    endDate: string;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    profilePicture: string;
    userId: string;
  };
  allBookings: SeatBookingDetail[];
}

export interface VendorCabin {
  _id: string;
  name: string;
  location: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
  floors?: any[];
  lockerAvailable: boolean;
  lockerPrice: number;
  lockerMandatory: boolean;
}

export interface SeatFilters {
  cabinId?: string;
  status?: 'available' | 'occupied' | 'expiring_soon' | 'blocked';
  search?: string;
  date?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  serialNumber: string;
  profilePicture: string;
}

export interface PartnerBookingData {
  seatId: string;
  cabinId: string;
  userId: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  bookingDuration: string;
  durationCount: string;
  seatNumber: number;
  lockerIncluded?: boolean;
  lockerPrice?: number;
  discountAmount?: number;
  discountReason?: string;
  paymentMethod?: string;
  collectedBy?: string;
  collectedByName?: string;
  transactionId?: string;
}

export interface BlockHistoryEntry {
  id: string;
  action: string;
  reason: string;
  performedBy: string;
  createdAt: string;
  blockFrom?: string;
  blockTo?: string;
}

function computeDateStatus(
  seat: { is_available: boolean; id: string },
  bookingsForDate: any[],
  selectedDate: string,
  dateBlocks?: any[]
): 'available' | 'booked' | 'expiring_soon' | 'blocked' {
  if (!seat.is_available) return 'blocked';

  // Check date-range blocks
  if (dateBlocks && dateBlocks.length > 0) {
    const hasActiveBlock = dateBlocks.some(
      (b) => b.seat_id === seat.id && b.action === 'blocked' && b.block_from && b.block_to && b.block_from <= selectedDate && b.block_to >= selectedDate
    );
    if (hasActiveBlock) return 'blocked';
  }

  const activeBooking = bookingsForDate.find(
    (b) => b.seat_id === seat.id && b.start_date <= selectedDate && b.end_date >= selectedDate
  );

  if (activeBooking) {
    const endDate = new Date(activeBooking.end_date);
    const selected = new Date(selectedDate);
    const diffDays = Math.ceil((endDate.getTime() - selected.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'expiring_soon';
    return 'booked';
  }

  return 'available';
}

function mapBookingToDetail(b: any): SeatBookingDetail {
  const profile = b.profiles as any;
  return {
    bookingId: b.id,
    serialNumber: b.serial_number || '',
    startDate: b.start_date || '',
    endDate: b.end_date || '',
    totalPrice: Number(b.total_price) || 0,
    paymentStatus: b.payment_status || '',
    bookingDuration: b.booking_duration || '',
    durationCount: b.duration_count || '',
    studentName: profile?.name || 'N/A',
    studentEmail: profile?.email || 'N/A',
    studentPhone: profile?.phone || 'N/A',
    studentSerialNumber: profile?.serial_number || '',
    profilePicture: profile?.profile_picture || '',
    course: profile?.course_studying || '',
    college: profile?.college_studied || '',
    address: profile?.address || '',
    city: profile?.city || '',
    state: profile?.state || '',
    gender: profile?.gender || '',
    dob: profile?.date_of_birth || '',
    userId: profile?.id || '',
    lockerIncluded: b.locker_included || false,
    lockerPrice: Number(b.locker_price) || 0,
    discountAmount: Number(b.discount_amount) || 0,
    discountReason: b.discount_reason || '',
    paymentMethod: b.payment_method || 'online',
    collectedByName: b.collected_by_name || '',
    transactionId: b.transaction_id || '',
  };
}

export const vendorSeatsService = {
  getVendorCabins: async () => {
    try {
      const { data: cabins, error } = await supabase
        .from('cabins')
        .select('*')
        .order('name');
      if (error) throw error;

      const { data: seats, error: seatsError } = await supabase
        .from('seats')
        .select('cabin_id, is_available');
      if (seatsError) throw seatsError;

      const cabinData: VendorCabin[] = (cabins || []).map(cabin => {
        const cabinSeats = (seats || []).filter(s => s.cabin_id === cabin.id);
        return {
          _id: cabin.id,
          name: cabin.name,
          location: cabin.full_address || '',
          totalSeats: cabinSeats.length,
          availableSeats: cabinSeats.filter(s => s.is_available).length,
          occupiedSeats: cabinSeats.filter(s => !s.is_available).length,
          floors: cabin.floors || [],
          lockerAvailable: cabin.locker_available,
          lockerPrice: Number(cabin.locker_price),
          lockerMandatory: cabin.locker_mandatory,
        };
      });

      return { success: true, data: { data: cabinData } };
    } catch (error) {
      console.error('Error fetching vendor cabins:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Date-aware seat fetcher - supports 'all' for all cabins
  getSeatsForDate: async (cabinId: string, date: string) => {
    try {
      let query = supabase
        .from('seats')
        .select('*, cabins!inner(id, name)')
        .order('number');

      if (cabinId !== 'all') {
        query = query.eq('cabin_id', cabinId);
      }

      const { data: seatsData, error } = await query;
      if (error) throw error;

      const seatIds = (seatsData || []).map(s => s.id);
      let allBookings: any[] = [];
      let dateBlocks: any[] = [];

      if (seatIds.length > 0) {
        const [bookingsRes, blocksRes] = await Promise.all([
          supabase
            .from('bookings')
            .select('*, profiles!bookings_user_id_fkey(id, name, email, phone, profile_picture, serial_number, course_studying, college_studied, address, city, state, date_of_birth, gender)')
            .in('seat_id', seatIds)
            .eq('payment_status', 'completed')
            .gte('end_date', date)
            .order('start_date', { ascending: true }),
          supabase
            .from('seat_block_history')
            .select('*')
            .in('seat_id', seatIds)
            .eq('action', 'blocked')
            .not('block_from', 'is', null)
            .not('block_to', 'is', null)
            .gte('block_to', date),
        ]);

        allBookings = bookingsRes.data || [];
        dateBlocks = blocksRes.data || [];
      }

      const mappedSeats: VendorSeat[] = (seatsData || []).map(seat => {
        const seatBookings = allBookings.filter(b => b.seat_id === seat.id);
        const dateStatus = computeDateStatus(seat, allBookings, date, dateBlocks);

        const currentBookingRaw = seatBookings.find(
          b => b.start_date <= date && b.end_date >= date
        );

        const currentBooking = currentBookingRaw ? {
          startDate: currentBookingRaw.start_date,
          endDate: currentBookingRaw.end_date,
          studentName: (currentBookingRaw.profiles as any)?.name || 'N/A',
          studentEmail: (currentBookingRaw.profiles as any)?.email || 'N/A',
          studentPhone: (currentBookingRaw.profiles as any)?.phone || 'N/A',
          profilePicture: (currentBookingRaw.profiles as any)?.profile_picture || '',
          userId: (currentBookingRaw.profiles as any)?.id || '',
        } : undefined;

        const mappedBookings: SeatBookingDetail[] = seatBookings.map(mapBookingToDetail);

        return {
          _id: seat.id,
          number: seat.number,
          cabinId: seat.cabin_id,
          cabinName: (seat.cabins as any)?.name || '',
          position: { x: Number(seat.position_x), y: Number(seat.position_y) },
          isAvailable: seat.is_available,
          price: Number(seat.price),
          category: seat.category,
          floor: seat.floor,
          unavailableUntil: seat.unavailable_until || undefined,
          dateStatus,
          currentBooking,
          allBookings: mappedBookings,
        };
      });

      return { success: true, data: mappedSeats };
    } catch (error) {
      console.error('Error fetching seats for date:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  searchStudents: async (query: string): Promise<{ success: boolean; data?: StudentProfile[]; error?: string }> => {
    try {
      const searchTerm = `%${query}%`;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, phone, serial_number, profile_picture')
        .or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`)
        .limit(20);

      if (error) throw error;

      const profiles: StudentProfile[] = (data || []).map(p => ({
        id: p.id,
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        serialNumber: p.serial_number || '',
        profilePicture: p.profile_picture || '',
      }));

      return { success: true, data: profiles };
    } catch (error) {
      console.error('Error searching students:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  createPartnerBooking: async (data: PartnerBookingData) => {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('bookings')
        .select('id')
        .eq('seat_id', data.seatId)
        .eq('payment_status', 'completed')
        .lte('start_date', data.endDate)
        .gte('end_date', data.startDate)
        .limit(1);

      if (checkError) throw checkError;
      if (existing && existing.length > 0) {
        return { success: false, error: 'Seat already has a booking for the selected dates' };
      }

      const { data: serialData } = await supabase.rpc('generate_serial_number', { p_entity_type: 'booking' });

      const paymentStatus = data.paymentMethod === 'send_link' ? 'pending' : 'completed';

      const { error, data: insertedData } = await supabase
        .from('bookings')
        .insert({
          seat_id: data.seatId,
          cabin_id: data.cabinId,
          user_id: data.userId,
          start_date: data.startDate,
          end_date: data.endDate,
          total_price: data.totalPrice,
          booking_duration: data.bookingDuration,
          duration_count: data.durationCount,
          seat_number: data.seatNumber,
          payment_status: paymentStatus,
          serial_number: serialData || undefined,
          locker_included: data.lockerIncluded || false,
          locker_price: data.lockerPrice || 0,
          discount_amount: data.discountAmount || 0,
          discount_reason: data.discountReason || '',
          payment_method: data.paymentMethod || 'online',
          collected_by: data.collectedBy || null,
          collected_by_name: data.collectedByName || '',
          transaction_id: data.transactionId || '',
        })
        .select('serial_number')
        .single();

      if (error) throw error;
      return { success: true, serialNumber: insertedData?.serial_number || serialData || '' };
    } catch (error) {
      console.error('Error creating partner booking:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Block/unblock with reason and history
  toggleSeatAvailability: async (seatId: string, isAvailable: boolean, reason?: string, blockFrom?: string, blockTo?: string) => {
    try {
      // Only set is_available = false for permanent blocks (no date range)
      if (!isAvailable && blockFrom && blockTo) {
        // Date-range block: don't change is_available
      } else {
        const { error } = await supabase.from('seats').update({ is_available: isAvailable }).eq('id', seatId);
        if (error) throw error;
      }

      // Log to block history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('seat_block_history').insert({
        seat_id: seatId,
        action: isAvailable ? 'unblocked' : 'blocked',
        reason: reason || '',
        performed_by: user?.id || null,
        block_from: blockFrom || null,
        block_to: blockTo || null,
      } as any);

      return { success: true, data: {} };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  getSeatBlockHistory: async (seatId: string): Promise<{ success: boolean; data?: BlockHistoryEntry[]; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('seat_block_history')
        .select('*')
        .eq('seat_id', seatId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const entries: BlockHistoryEntry[] = (data || []).map((d: any) => ({
        id: d.id,
        action: d.action,
        reason: d.reason,
        performedBy: d.performed_by || '',
        createdAt: d.created_at,
        blockFrom: d.block_from || undefined,
        blockTo: d.block_to || undefined,
      }));

      return { success: true, data: entries };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Create student via edge function
  createStudent: async (name: string, email: string, phone: string): Promise<{ success: boolean; userId?: string; existing?: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-student', {
        body: { name, email, phone },
      });

      if (error) throw error;
      if (data?.error) return { success: false, error: data.error };

      return { success: true, userId: data.userId, existing: data.existing };
    } catch (error) {
      console.error('Error creating student:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  updateSeatPrice: async (seatId: string, price: number) => {
    try {
      const { error } = await supabase.from('seats').update({ price }).eq('id', seatId);
      if (error) throw error;
      return { success: true, data: {} };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  // Legacy methods kept for compatibility
  getVendorSeats: async (filters?: SeatFilters) => {
    try {
      let query = supabase
        .from('seats')
        .select('*, cabins!inner(id, name)')
        .order('number');

      if (filters?.cabinId) query = query.eq('cabin_id', filters.cabinId);
      if (filters?.status === 'available') query = query.eq('is_available', true);
      else if (filters?.status === 'occupied') query = query.eq('is_available', false);

      const { data: seatsData, error } = await query;
      if (error) throw error;

      const seatIds = (seatsData || []).map(s => s.id);
      const today = new Date().toISOString().split('T')[0];
      let bookingsMap: Record<string, any> = {};
      let allBookingsMap: Record<string, SeatBookingDetail[]> = {};

      if (seatIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*, profiles!bookings_user_id_fkey(id, name, email, phone, profile_picture, serial_number, course_studying, college_studied, address, city, state, date_of_birth, gender)')
          .in('seat_id', seatIds)
          .eq('payment_status', 'completed')
          .gte('end_date', today)
          .order('start_date', { ascending: true });

        (bookings || []).forEach(b => {
          const detail = mapBookingToDetail(b);
          if (!allBookingsMap[b.seat_id!]) allBookingsMap[b.seat_id!] = [];
          allBookingsMap[b.seat_id!].push(detail);
          if (b.start_date && b.start_date <= today && b.end_date && b.end_date >= today) {
            const profile = b.profiles as any;
            bookingsMap[b.seat_id!] = {
              startDate: b.start_date, endDate: b.end_date,
              studentName: profile?.name || 'N/A', studentEmail: profile?.email || 'N/A',
              studentPhone: profile?.phone || 'N/A', profilePicture: profile?.profile_picture || '',
              userId: profile?.id || '',
            };
          }
        });
      }

      const mappedSeats: VendorSeat[] = (seatsData || []).map(seat => ({
        _id: seat.id, number: seat.number, cabinId: seat.cabin_id,
        cabinName: (seat.cabins as any)?.name || '',
        position: { x: Number(seat.position_x), y: Number(seat.position_y) },
        isAvailable: seat.is_available, price: Number(seat.price),
        category: seat.category, floor: seat.floor,
        unavailableUntil: seat.unavailable_until || undefined,
        currentBooking: bookingsMap[seat.id] || undefined,
        allBookings: allBookingsMap[seat.id] || [],
      }));

      return { success: true, data: { data: mappedSeats } };
    } catch (error) {
      console.error('Error fetching vendor seats:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  getCabinSeats: async (cabinId: string) => {
    return vendorSeatsService.getVendorSeats({ cabinId });
  },

  getSeatBookingDetails: async (seatId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles!bookings_user_id_fkey(name, email, phone, profile_picture)')
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
