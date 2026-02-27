
import { supabase } from '@/integrations/supabase/client';

export interface CreateHostelBookingData {
  hostel_id: string;
  room_id: string;
  bed_id: string;
  sharing_option_id: string;
  start_date: string;
  end_date: string;
  booking_duration: 'daily' | 'weekly' | 'monthly';
  duration_count: number;
  total_price: number;
  advance_amount?: number;
  remaining_amount?: number;
  security_deposit?: number;
  payment_method?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  transaction_id?: string;
}

export const hostelBookingService = {
  createBooking: async (bookingData: CreateHostelBookingData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check bed availability
    const { data: bed } = await supabase
      .from('hostel_beds')
      .select('is_available, is_blocked')
      .eq('id', bookingData.bed_id)
      .single();

    if (!bed?.is_available || bed?.is_blocked) {
      throw new Error('The selected bed is not available');
    }

    // Check gender restriction
    const { data: hostel } = await supabase
      .from('hostels')
      .select('gender')
      .eq('id', bookingData.hostel_id)
      .single();

    if (hostel?.gender && hostel.gender !== 'Co-ed') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', user.id)
        .single();

      if (profile?.gender) {
        const hostelGenderMap: Record<string, string> = { 'Male': 'Male', 'Female': 'Female' };
        if (hostelGenderMap[hostel.gender] && profile.gender !== hostel.gender) {
          throw new Error(`This hostel is for ${hostel.gender} students only`);
        }
      }
    }

    const paymentStatus = bookingData.advance_amount && bookingData.advance_amount > 0 && bookingData.advance_amount < bookingData.total_price
      ? 'advance_paid'
      : bookingData.razorpay_payment_id ? 'completed' : 'pending';

    const { data: booking, error } = await supabase
      .from('hostel_bookings')
      .insert({
        ...bookingData,
        user_id: user.id,
        payment_status: paymentStatus,
        status: paymentStatus === 'pending' ? 'pending' : 'confirmed',
      })
      .select()
      .single();
    if (error) throw error;

    // Mark bed as unavailable
    await supabase.from('hostel_beds').update({ is_available: false }).eq('id', bookingData.bed_id);

    // Create receipt if payment was made
    if (paymentStatus !== 'pending') {
      const receiptAmount = bookingData.advance_amount || bookingData.total_price;
      await supabase.from('hostel_receipts').insert({
        booking_id: booking.id,
        user_id: user.id,
        hostel_id: bookingData.hostel_id,
        amount: receiptAmount,
        payment_method: bookingData.payment_method || 'online',
        transaction_id: bookingData.transaction_id || bookingData.razorpay_payment_id || '',
        receipt_type: 'booking_payment',
      });
    }

    return booking;
  },

  getUserBookings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('hostel_bookings')
      .select('*, hostels(name, location, logo_image), hostel_rooms(room_number), hostel_beds(bed_number), hostel_sharing_options(type)')
      .eq('user_id', user?.id ?? '')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  getBookingById: async (bookingId: string) => {
    const { data, error } = await supabase
      .from('hostel_bookings')
      .select('*, hostels(name, location, contact_phone, logo_image), hostel_rooms(room_number, floor, category), hostel_beds(bed_number), hostel_sharing_options(type, capacity, price_monthly, price_daily), profiles:user_id(name, email, phone)')
      .eq('id', bookingId)
      .single();
    if (error) throw error;
    return data;
  },

  cancelBooking: async (bookingId: string, reason?: string) => {
    const { data: booking } = await supabase
      .from('hostel_bookings')
      .select('bed_id')
      .eq('id', bookingId)
      .single();

    if (booking?.bed_id) {
      await supabase.from('hostel_beds').update({ is_available: true }).eq('id', booking.bed_id);
    }

    const { data, error } = await supabase
      .from('hostel_bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || '',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Get available beds for a room on specific dates
  getAvailableBeds: async (roomId: string, startDate: string, endDate: string) => {
    // Get all beds for this room
    const { data: beds, error: bedsError } = await supabase
      .from('hostel_beds')
      .select('*, hostel_sharing_options(type, capacity, price_monthly, price_daily)')
      .eq('room_id', roomId)
      .eq('is_blocked', false);
    if (bedsError) throw bedsError;

    // Get active bookings that overlap with the requested dates
    const { data: overlappingBookings, error: bookingsError } = await supabase
      .from('hostel_bookings')
      .select('bed_id')
      .eq('room_id', roomId)
      .in('status', ['confirmed', 'pending'])
      .lte('start_date', endDate)
      .gte('end_date', startDate);
    if (bookingsError) throw bookingsError;

    const bookedBedIds = new Set(overlappingBookings?.map(b => b.bed_id) || []);

    return beds?.map(bed => ({
      ...bed,
      is_available: !bookedBedIds.has(bed.id) && bed.is_available,
    })) || [];
  },

  // Get booking receipts
  getBookingReceipts: async (bookingId: string) => {
    const { data, error } = await supabase
      .from('hostel_receipts')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // Admin: get all bookings with filters
  getAllBookings: async (params?: { hostel_id?: string; status?: string; payment_status?: string }) => {
    let query = supabase
      .from('hostel_bookings')
      .select('*, hostels(name), hostel_rooms(room_number), hostel_beds(bed_number), hostel_sharing_options(type), profiles:user_id(name, email, phone)')
      .order('created_at', { ascending: false });

    if (params?.hostel_id) query = query.eq('hostel_id', params.hostel_id);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.payment_status) query = query.eq('payment_status', params.payment_status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get bookings by room (for occupancy view)
  getBookingsByRoom: async (roomId: string) => {
    const { data, error } = await supabase
      .from('hostel_bookings')
      .select('*, hostel_beds(bed_number), profiles:user_id(name, phone)')
      .eq('room_id', roomId)
      .in('status', ['confirmed', 'pending'])
      .order('start_date', { ascending: true });
    if (error) throw error;
    return data;
  },
};
