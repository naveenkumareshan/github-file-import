import { supabase } from '@/integrations/supabase/client';

export interface DepositRefund {
  _id: string;
  transactionId: string;
  booking: any;
  user: any;
  cabin: any;
  seat: any;
  keyDeposit: number;
  isKeyDepositPaid: boolean;
  keyDepositRefunded: boolean;
  keyDepositRefundDate?: string;
  refundAmount?: number;
  refundReason?: string;
  refundMethod?: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositRefundFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  cabinId?: string;
  type?: string;
  dateFilter?: 'all' | 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Helper to apply date filters to a query
const applyDateFilter = (query: any, dateFilter?: string, startDate?: string, endDate?: string) => {
  if (!dateFilter || dateFilter === 'all') return query;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  switch (dateFilter) {
    case 'today':
      return query.eq('end_date', today);
    case 'this_week': {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      return query.gte('end_date', weekStart.toISOString().split('T')[0]).lte('end_date', today);
    }
    case 'this_month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return query.gte('end_date', monthStart.toISOString().split('T')[0]);
    }
    case 'last_month': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return query.gte('end_date', lastMonthStart.toISOString().split('T')[0]).lte('end_date', lastMonthEnd.toISOString().split('T')[0]);
    }
    case 'this_year': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return query.gte('end_date', yearStart.toISOString().split('T')[0]);
    }
    case 'last_year': {
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      return query.gte('end_date', lastYearStart.toISOString().split('T')[0]).lte('end_date', lastYearEnd.toISOString().split('T')[0]);
    }
    case 'custom':
      if (startDate) query = query.gte('end_date', startDate.split('T')[0]);
      if (endDate) query = query.lte('end_date', endDate.split('T')[0]);
      return query;
    default:
      return query;
  }
};

// Map Supabase booking row to DepositRefund interface
const mapToDepositRefund = (booking: any): DepositRefund => ({
  _id: booking.id,
  transactionId: booking.locker_refund_transaction_id || '',
  booking: { bookingId: booking.serial_number || booking.id },
  user: booking.profiles || { name: 'N/A' },
  cabin: booking.cabins || { name: 'N/A' },
  seat: { number: booking.seat_number || 'N/A' },
  keyDeposit: booking.locker_price || 0,
  isKeyDepositPaid: booking.locker_included,
  keyDepositRefunded: booking.locker_refunded,
  keyDepositRefundDate: booking.locker_refund_date,
  refundAmount: booking.locker_refund_amount,
  refundReason: '',
  refundMethod: booking.locker_refund_method,
  endDate: booking.end_date,
  status: booking.payment_status,
  paymentStatus: booking.payment_status,
  createdAt: booking.created_at,
  updatedAt: booking.updated_at,
});

export const depositRefundService = {
  // Get deposits (all bookings with locker_included = true)
  getDeposits: async (page = 1, limit = 20, filters: DepositRefundFilters = {}) => {
    try {
      let query = supabase
        .from('bookings')
        .select('*, profiles!bookings_user_id_fkey(name, email, phone), cabins(name)', { count: 'exact' })
        .eq('locker_included', true)
        .gt('locker_price', 0)
        .in('payment_status', ['completed', 'advance_paid']);

      // Apply status filter
      if (filters.status === 'pending') {
        query = query.eq('locker_refunded', false);
      } else if (filters.status === 'refunded') {
        query = query.eq('locker_refunded', true);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`serial_number.ilike.%${filters.search}%`);
      }

      // Apply date filter
      query = applyDateFilter(query, filters.dateFilter, filters.startDate, filters.endDate);

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      return {
        success: true,
        data: {
          data: (data || []).map(mapToDepositRefund),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      console.error('Error fetching deposits:', error);
      return { success: false, error: error.message };
    }
  },

  // Get refunds: pending (expired + not refunded) or refunded
  getRefunds: async (page = 1, limit = 20, filters: DepositRefundFilters = {}) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      let query = supabase
        .from('bookings')
        .select('*, profiles!bookings_user_id_fkey(name, email, phone), cabins(name)', { count: 'exact' })
        .eq('locker_included', true)
        .gt('locker_price', 0)
        .in('payment_status', ['completed', 'advance_paid']);

      // For "Refunds" tab: expired bookings not yet refunded
      if (filters.status === 'pending') {
        query = query.eq('locker_refunded', false).lt('end_date', today);
      }
      // For "Refunded" tab: already refunded
      else if (filters.status === 'refunded') {
        query = query.eq('locker_refunded', true);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(`serial_number.ilike.%${filters.search}%`);
      }

      // Apply date filter
      query = applyDateFilter(query, filters.dateFilter, filters.startDate, filters.endDate);

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.order('end_date', { ascending: true }).range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const total = count || 0;
      return {
        success: true,
        data: {
          data: (data || []).map(mapToDepositRefund),
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error: any) {
      console.error('Error fetching refunds:', error);
      return { success: false, error: error.message };
    }
  },

  // Process refund for a single booking
  processRefund: async (bookingId: string, refundData: {
    refundAmount: number;
    refundReason?: string;
    refundMethod?: string;
    transactionId?: string;
    transactionImageUrl?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          locker_refunded: true,
          locker_refund_date: new Date().toISOString(),
          locker_refund_amount: refundData.refundAmount,
          locker_refund_method: refundData.refundMethod || '',
          locker_refund_transaction_id: refundData.transactionId || '',
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return { success: false, error: error.message };
    }
  },

  // Bulk process refunds
  bulkProcessRefunds: async (bookingIds: string[], refundData: {
    refundAmount: number;
    refundReason?: string;
    refundMethod?: string;
    transactionId?: string;
    transactionImageUrl?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          locker_refunded: true,
          locker_refund_date: new Date().toISOString(),
          locker_refund_amount: refundData.refundAmount,
          locker_refund_method: refundData.refundMethod || '',
          locker_refund_transaction_id: refundData.transactionId || '',
        })
        .in('id', bookingIds)
        .select();

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error processing bulk refunds:', error);
      return { success: false, error: error.message };
    }
  },

  // Export deposits report (client-side CSV download)
  exportDepositsReport: async (filters: DepositRefundFilters = {}, format: 'excel' | 'pdf' = 'excel') => {
    try {
      let query = supabase
        .from('bookings')
        .select('*, profiles!bookings_user_id_fkey(name, email, phone), cabins(name)')
        .eq('locker_included', true)
        .gt('locker_price', 0)
        .in('payment_status', ['completed', 'advance_paid'])
        .order('created_at', { ascending: false });

      if (filters.status === 'pending') query = query.eq('locker_refunded', false);
      if (filters.status === 'refunded') query = query.eq('locker_refunded', true);

      query = applyDateFilter(query, filters.dateFilter, filters.startDate, filters.endDate);

      const { data, error } = await query;
      if (error) throw error;

      // Generate CSV
      const rows = (data || []).map((b: any) => ({
        'Booking ID': b.serial_number || b.id,
        'Student': b.profiles?.name || 'N/A',
        'Room': b.cabins?.name || 'N/A',
        'Seat': b.seat_number || 'N/A',
        'Locker Deposit': b.locker_price,
        'End Date': b.end_date,
        'Refunded': b.locker_refunded ? 'Yes' : 'No',
        'Refund Amount': b.locker_refund_amount || 0,
        'Refund Method': b.locker_refund_method || '',
        'Refund Date': b.locker_refund_date || '',
      }));

      const headers = Object.keys(rows[0] || {});
      const csv = [headers.join(','), ...rows.map((r: any) => headers.map(h => `"${r[h]}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `deposits-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error: any) {
      console.error('Error exporting deposits report:', error);
      return { success: false, error: error.message };
    }
  },
};
