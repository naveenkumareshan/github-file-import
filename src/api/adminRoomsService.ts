import { supabase } from '@/integrations/supabase/client';

export const adminRoomsService = {
  toggleRoomActive: async (id: string, isActive: boolean) => {
    try {
      const updateData: any = { is_active: isActive };
      // When deactivating, also disable booking
      if (!isActive) {
        updateData.is_booking_active = false;
      }

      const { data, error } = await supabase
        .from('cabins')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error toggling room active:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to update room status' };
    }
  },

  toggleBookingActive: async (id: string, isBookingActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('cabins')
        .update({ is_booking_active: isBookingActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error toggling booking status:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Failed to update booking status' };
    }
  },
};
