import { supabase } from '@/integrations/supabase/client';

interface UserFilters {
  status?: string;
  role?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  includeInactive?: boolean;
}

interface BookingFilters {
  status?: string;
  endDate?: string;
  cabinId?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface UserUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  isActive?: boolean;
  address?: string;
  bio?: string;
  courseStudying?: string;
  collegeStudied?: string;
  parentMobileNumber?: string;
}

export const adminUsersService = {
  getUsers: async (filters?: UserFilters) => {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const from = (page - 1) * limit;

      // Get profiles
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

      const { data: profiles, error, count } = await query;
      if (error) throw error;

      // Get roles for these users
      const userIds = (profiles || []).map(p => p.id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds.length > 0 ? userIds : ['none']);

      const roleMap: Record<string, string> = {};
      (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });

      // Filter by role if specified
      let filteredProfiles = (profiles || []).map(p => ({
        _id: p.id,
        id: p.id,
        userId: p.id?.slice(0, 8),
        name: p.name || 'Unknown',
        email: p.email || '',
        phone: p.phone || '',
        gender: p.gender || '',
        role: roleMap[p.id] || 'student',
        bookingsCount: 0,
        activeBookings: 0,
        joinedAt: p.created_at || '',
        isActive: true,
        collegeStudied: p.college_studied || '',
        courseStudying: p.course_studying || '',
        parentMobileNumber: p.parent_mobile_number || '',
        address: p.address || '',
        bio: p.bio || '',
        profilePicture: p.profile_picture || '',
      }));

      if (filters?.role) {
        filteredProfiles = filteredProfiles.filter(p => p.role === filters.role);
      }

      return {
        success: true,
        data: filteredProfiles,
        count: count || 0,
        totalCount: count || 0,
        pagination: {
          totalPages: Math.ceil((count || 0) / limit),
          currentPage: page,
        },
      };
    } catch (e) {
      console.error('Error fetching users:', e);
      return { success: false, data: [], count: 0, totalCount: 0, pagination: { totalPages: 1, currentPage: 1 } };
    }
  },

  getUserById: async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, data: null };
    }
  },

  updateUser: async (userId: string, userData: UserUpdateData) => {
    try {
      const updateData: any = {};
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.email !== undefined) updateData.email = userData.email;
      if (userData.phone !== undefined) updateData.phone = userData.phone;
      if (userData.gender !== undefined) updateData.gender = userData.gender;
      if (userData.address !== undefined) updateData.address = userData.address;
      if (userData.bio !== undefined) updateData.bio = userData.bio;
      if (userData.courseStudying !== undefined) updateData.course_studying = userData.courseStudying;
      if (userData.collegeStudied !== undefined) updateData.college_studied = userData.collegeStudied;
      if (userData.parentMobileNumber !== undefined) updateData.parent_mobile_number = userData.parentMobileNumber;

      const { data, error } = await supabase.from('profiles').update(updateData).eq('id', userId).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, data: null };
    }
  },

  getBookingsByUserId: async (filters?: BookingFilters) => {
    try {
      let query = supabase.from('bookings').select('*');
      if (filters?.userId) query = query.eq('user_id', filters.userId);
      if (filters?.status) query = query.eq('payment_status', filters.status);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const mapped = (data || []).map(b => ({
        _id: b.id,
        id: b.id,
        cabinId: { name: 'Reading Room' },
        seatId: { number: b.seat_number },
        startDate: b.start_date,
        endDate: b.end_date,
        totalPrice: b.total_price,
        paymentStatus: b.payment_status,
        months: b.duration_count,
      }));

      return { success: true, data: mapped };
    } catch (e) {
      return { success: false, data: [] };
    }
  },

  getBookingById: async (id: string) => {
    try {
      const { data, error } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, data: null };
    }
  },

  updateBooking: async (id: string, updateData: any) => {
    try {
      const { data, error } = await supabase.from('bookings').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (e) {
      return { success: false, data: null };
    }
  },

  cancelBooking: async (id: string) => {
    try {
      const { error } = await supabase.from('bookings').update({ payment_status: 'cancelled' }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  getBookingReports: async (filters?: BookingFilters) => {
    return { success: true, data: {} };
  },

  getBookingStatistics: async (timeRange?: string) => {
    return { success: true, data: {} };
  },

  getOccupancyRates: async (timeRange?: string) => {
    return { success: true, data: {} };
  },

  getRevenueReports: async (filters?: BookingFilters) => {
    return { success: true, data: {} };
  },
};
