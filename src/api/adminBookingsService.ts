
import { supabase } from '@/integrations/supabase/client';

interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  cabinId?: string;
  userId?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export const adminBookingsService = {
  getAllBookings: async (filters?: BookingFilters) => {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('bookings')
        .select('*, profiles!bookings_user_id_fkey(name, email, phone, profile_picture, serial_number), cabins:cabin_id(name, serial_number), seats:seat_id(number, category), cabin_slots:slot_id(name), dues!dues_booking_id_fkey(advance_paid, paid_amount, due_amount)', { count: 'exact' });

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('payment_status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`serial_number.ilike.%${filters.search}%`);
      }
      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }
      if (filters?.cabinId) {
        query = query.eq('cabin_id', filters.cabinId);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      // Sorting
      const sortCol = filters?.sortBy === 'startDate' ? 'start_date' 
        : filters?.sortBy === 'endDate' ? 'end_date'
        : filters?.sortBy === 'totalPrice' ? 'total_price'
        : 'created_at';
      query = query.order(sortCol, { ascending: filters?.order === 'asc' });

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      // Map to legacy format for AdminBookingsList compatibility
      const mapped = (data || []).map(b => {
        const profile = b.profiles as any;
        const cabin = b.cabins as any;
        const seat = b.seats as any;
        const slot = (b as any).cabin_slots as any;
        return {
          _id: b.id,
          bookingId: b.serial_number || b.id.substring(0, 8),
          userId: {
            name: profile?.name || 'N/A',
            email: profile?.email || 'N/A',
            phone: profile?.phone || '',
            userId: profile?.serial_number || '',
            profilePicture: profile?.profile_picture || '',
          },
          cabinId: cabin ? { name: cabin.name, cabinCode: cabin.serial_number || '' } : undefined,
          seatId: seat ? { number: seat.number } : undefined,
          startDate: b.start_date,
          endDate: b.end_date,
          totalPrice: Number(b.total_price) || 0,
          seatPrice: (Number(b.total_price) || 0) - (Number(b.locker_price) || 0),
          lockerPrice: Number(b.locker_price) || 0,
          paymentStatus: b.payment_status || 'pending',
          status: b.payment_status || 'pending',
          durationCount: b.duration_count ? parseInt(b.duration_count) : undefined,
          createdAt: b.created_at,
          payoutStatus: 'pending',
          originalPrice: undefined,
          appliedCoupon: undefined,
          seatCategory: seat?.category || '',
          slotName: slot?.name || (b.slot_id ? '' : 'Full Day'),
          bookingDuration: b.booking_duration || '',
          totalPaid: (() => {
            const duesArr = (b as any).dues as any[] | null;
            const due = Array.isArray(duesArr) ? duesArr[0] : duesArr;
            if (due) return (Number(due.advance_paid) || 0) + (Number(due.paid_amount) || 0);
            return b.payment_status === 'completed' ? (Number(b.total_price) || 0) : 0;
          })(),
          duePending: (() => {
            const duesArr = (b as any).dues as any[] | null;
            const due = Array.isArray(duesArr) ? duesArr[0] : duesArr;
            if (due) return (Number(due.due_amount) || 0) - (Number(due.paid_amount) || 0);
            return 0;
          })(),
        };
      });

      const totalDocs = count || 0;
      const totalPages = Math.ceil(totalDocs / limit);

      return {
        success: true,
        data: mapped,
        count: totalDocs,
        totalDocs,
        totalPages,
      };
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed',
        message: error instanceof Error ? error.message : 'Failed',
      };
    }
  },

  getAllTransactions: async (filters?: BookingFilters) => {
    // Reuse getAllBookings for transactions view
    return adminBookingsService.getAllBookings(filters);
  },

  getBookingById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles!bookings_user_id_fkey(name, email, phone, profile_picture, serial_number), cabins:cabin_id(name, serial_number), seats:seat_id(number, price)')
        .eq('id', id)
        .single();

      if (error) throw error;

      const profile = data.profiles as any;
      const cabin = data.cabins as any;
      const seat = data.seats as any;

      return {
        success: true,
        data: {
          _id: data.id,
          bookingId: data.serial_number || data.id,
          userId: {
            name: profile?.name || 'N/A',
            email: profile?.email || 'N/A',
            userId: profile?.serial_number || '',
            profilePicture: profile?.profile_picture || '',
          },
          cabinId: cabin ? { name: cabin.name, cabinCode: cabin.serial_number || '' } : undefined,
          seatId: seat ? { number: seat.number } : undefined,
          seatPrice: seat ? Number(seat.price) || 0 : 0,
          startDate: data.start_date,
          endDate: data.end_date,
          totalPrice: Number(data.total_price) || 0,
          paymentStatus: data.payment_status || 'pending',
          status: data.payment_status || 'pending',
          createdAt: data.created_at,
          razorpayPaymentId: data.razorpay_payment_id,
          razorpayOrderId: data.razorpay_order_id,
          paymentMethod: data.payment_method || '',
          transactionId: data.transaction_id || '',
          collectedByName: data.collected_by_name || '',
          lockerIncluded: data.locker_included,
          lockerPrice: Number(data.locker_price) || 0,
          discountAmount: Number(data.discount_amount) || 0,
          discountReason: data.discount_reason || '',
          bookingDuration: data.booking_duration,
          durationCount: data.duration_count,
        },
      };
    } catch (error) {
      console.error(`Error fetching booking ${id}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  updateBookingStatus: async (id: string, status: 'pending' | 'completed' | 'failed') => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ payment_status: status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  updateBooking: async (id: string, bookingData: any) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  updateTransferBooking: async (id: string, bookingData: any) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(bookingData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  cancelBooking: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ payment_status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
  },

  getBookingStats: async (period: 'day' | 'week' | 'month' | 'year' = 'month') => {
    try {
      const { data, error } = await supabase.from('bookings').select('payment_status');
      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        completed: data?.filter(b => b.payment_status === 'completed').length || 0,
        pending: data?.filter(b => b.payment_status === 'pending').length || 0,
        cancelled: data?.filter(b => b.payment_status === 'cancelled').length || 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      return { success: false, data: { total: 0, completed: 0, pending: 0, cancelled: 0 } };
    }
  },

  getRevenueByTransaction: async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_price, payment_status')
        .eq('payment_status', 'completed');
      if (error) throw error;

      const totalRevenue = (data || []).reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
      return { success: true, data: { totalRevenue, count: data?.length || 0 } };
    } catch (error) {
      return { success: false, data: { totalRevenue: 0, count: 0 } };
    }
  },

  getRevenueReport: async (filters?: BookingFilters) => {
    return adminBookingsService.getRevenueByTransaction();
  },

  getFiltersData: async () => {
    try {
      const { data: cabins } = await supabase.from('cabins').select('id, name').eq('is_active', true);
      return { success: true, data: { cabins: cabins || [] } };
    } catch (error) {
      return { success: false, data: { cabins: [] } };
    }
  },

  getOccupancyReports: async (params: {
    startDate?: string;
    endDate?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    cabinId?: string;
  }) => {
    return { success: true, data: [] };
  },

  getExpiringBookings: async (daysThreshold: number = 7) => {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysThreshold);

      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles!bookings_user_id_fkey(name, email, phone), cabins:cabin_id(name), seats:seat_id(number)')
        .eq('payment_status', 'completed')
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .order('end_date');

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  getTopFillingRooms: async (limit: number = 10) => {
    return { success: true, data: [] };
  },

  getMonthlyRevenue: async (year: number = new Date().getFullYear()) => {
    return { success: true, data: [] };
  },

  getMonthlyOccupancy: async (year: number = new Date().getFullYear()) => {
    return { success: true, data: [] };
  },

  getActiveResidents: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bookings')
        .select('*, profiles!bookings_user_id_fkey(name, email, phone, profile_picture), cabins:cabin_id(name), seats:seat_id(number)')
        .eq('payment_status', 'completed')
        .lte('start_date', today)
        .gte('end_date', today);
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, data: [] };
    }
  }
};
