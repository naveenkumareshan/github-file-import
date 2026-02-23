import { supabase } from '@/integrations/supabase/client';

export interface SeatCategory {
  id: string;
  cabin_id: string;
  name: string;
  price: number;
  created_at: string;
}

export const seatCategoryService = {
  getCategories: async (cabinId: string): Promise<{ success: boolean; data: SeatCategory[] }> => {
    try {
      const { data, error } = await supabase
        .from('seat_categories')
        .select('*')
        .eq('cabin_id', cabinId)
        .order('name');
      if (error) throw error;
      return { success: true, data: (data || []) as SeatCategory[] };
    } catch (e) {
      console.error('Error fetching seat categories:', e);
      return { success: false, data: [] };
    }
  },

  createCategory: async (cabinId: string, name: string, price: number): Promise<{ success: boolean; data: SeatCategory | null }> => {
    try {
      const { data, error } = await supabase
        .from('seat_categories')
        .insert({ cabin_id: cabinId, name, price })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as SeatCategory };
    } catch (e) {
      console.error('Error creating category:', e);
      return { success: false, data: null };
    }
  },

  updateCategory: async (id: string, updates: { name?: string; price?: number }): Promise<{ success: boolean; data: SeatCategory | null }> => {
    try {
      const { data, error } = await supabase
        .from('seat_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as SeatCategory };
    } catch (e) {
      console.error('Error updating category:', e);
      return { success: false, data: null };
    }
  },

  deleteCategory: async (id: string): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('seat_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error deleting category:', e);
      return { success: false };
    }
  },
};
