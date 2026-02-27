import { supabase } from '@/integrations/supabase/client';

export interface CabinSlot {
  id: string;
  cabin_id: string;
  name: string;
  start_time: string;
  end_time: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateSlotData {
  cabin_id: string;
  name: string;
  start_time: string;
  end_time: string;
  price: number;
}

export const cabinSlotService = {
  getSlotsByCabin: async (cabinId: string) => {
    try {
      const { data, error } = await supabase
        .from('cabin_slots')
        .select('*')
        .eq('cabin_id', cabinId)
        .eq('is_active', true)
        .order('start_time');
      if (error) throw error;
      return { success: true, data: (data || []) as CabinSlot[] };
    } catch (e) {
      console.error('Error fetching slots:', e);
      return { success: false, data: [] as CabinSlot[] };
    }
  },

  getAllSlotsByCabin: async (cabinId: string) => {
    try {
      const { data, error } = await supabase
        .from('cabin_slots')
        .select('*')
        .eq('cabin_id', cabinId)
        .order('start_time');
      if (error) throw error;
      return { success: true, data: (data || []) as CabinSlot[] };
    } catch (e) {
      console.error('Error fetching all slots:', e);
      return { success: false, data: [] as CabinSlot[] };
    }
  },

  createSlot: async (slotData: CreateSlotData) => {
    try {
      const { data, error } = await supabase
        .from('cabin_slots')
        .insert(slotData)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as CabinSlot };
    } catch (e) {
      console.error('Error creating slot:', e);
      return { success: false, data: null };
    }
  },

  updateSlot: async (id: string, updates: Partial<CabinSlot>) => {
    try {
      const { data, error } = await supabase
        .from('cabin_slots')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as CabinSlot };
    } catch (e) {
      console.error('Error updating slot:', e);
      return { success: false, data: null };
    }
  },

  deleteSlot: async (id: string) => {
    try {
      const { error } = await supabase
        .from('cabin_slots')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error deleting slot:', e);
      return { success: false };
    }
  },

  toggleSlotActive: async (id: string, isActive: boolean) => {
    try {
      const { data, error } = await supabase
        .from('cabin_slots')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as CabinSlot };
    } catch (e) {
      console.error('Error toggling slot:', e);
      return { success: false, data: null };
    }
  },
};
