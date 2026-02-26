
import { supabase } from '@/integrations/supabase/client';

export interface ReviewData {
  booking_id: string;
  cabin_id: string;
  rating: number;
  title?: string;
  comment: string;
}

export interface Review {
  id: string;
  user_id: string;
  booking_id: string;
  cabin_id: string;
  rating: number;
  title: string | null;
  comment: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    name: string | null;
    profile_picture: string | null;
    email: string | null;
  } | null;
  cabins?: {
    name: string;
  } | null;
}

export const reviewsService = {
  createReview: async (data: ReviewData) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data: review, error } = await supabase
      .from('reviews' as any)
      .insert({
        user_id: userData.user.id,
        booking_id: data.booking_id,
        cabin_id: data.cabin_id,
        rating: data.rating,
        title: data.title || null,
        comment: data.comment,
        status: 'pending',
      } as any)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: review };
  },

  getApprovedReviews: async (cabinId: string) => {
    const { data, error } = await supabase
      .from('reviews' as any)
      .select('*, profiles:user_id(name, profile_picture)')
      .eq('cabin_id', cabinId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  },

  getUserReviewForBooking: async (bookingId: string) => {
    const { data, error } = await supabase
      .from('reviews' as any)
      .select('id, status')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  getUserReviewsForBookings: async (bookingIds: string[]) => {
    if (bookingIds.length === 0) return [];
    const { data, error } = await supabase
      .from('reviews' as any)
      .select('id, booking_id, status')
      .in('booking_id', bookingIds);

    if (error) throw error;
    return (data || []) as Array<{ id: string; booking_id: string; status: string }>;
  },

  getAdminReviews: async (statusFilter?: string, cabinId?: string, page = 1, limit = 10) => {
    let query = supabase
      .from('reviews' as any)
      .select('*, profiles:user_id(name, profile_picture, email), cabins:cabin_id(name)', { count: 'exact' });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (cabinId && cabinId !== 'all') {
      query = query.eq('cabin_id', cabinId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      success: true,
      data: data || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  updateReviewStatus: async (reviewId: string, status: string) => {
    const { data, error } = await supabase
      .from('reviews' as any)
      .update({ status } as any)
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  deleteReview: async (reviewId: string) => {
    const { error } = await supabase
      .from('reviews' as any)
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    return { success: true };
  },

  getCabinRatingStats: async (cabinId: string) => {
    const { data, error } = await supabase.rpc('get_cabin_rating_stats', {
      p_cabin_id: cabinId,
    });

    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return {
      average_rating: Number(row?.average_rating || 0),
      review_count: Number(row?.review_count || 0),
    };
  },

  getCabinRatingStatsBatch: async (cabinIds: string[]) => {
    const results: Record<string, { average_rating: number; review_count: number }> = {};
    // Fetch in parallel
    await Promise.all(
      cabinIds.map(async (id) => {
        try {
          results[id] = await reviewsService.getCabinRatingStats(id);
        } catch {
          results[id] = { average_rating: 0, review_count: 0 };
        }
      })
    );
    return results;
  },
};
