import { supabase } from '@/integrations/supabase/client';

export interface HostelBedCategory {
  id: string;
  hostel_id: string;
  name: string;
  price_adjustment: number;
  created_at: string;
}

export const hostelBedCategoryService = {
  getCategories: async (hostelId: string): Promise<{ success: boolean; data: HostelBedCategory[] }> => {
    try {
      const { data, error } = await supabase
        .from('hostel_bed_categories')
        .select('*')
        .eq('hostel_id', hostelId)
        .order('name');
      if (error) throw error;
      return { success: true, data: (data || []) as HostelBedCategory[] };
    } catch (e) {
      console.error('Error fetching hostel bed categories:', e);
      return { success: false, data: [] };
    }
  },

  createCategory: async (hostelId: string, name: string, priceAdjustment: number): Promise<{ success: boolean; data: HostelBedCategory | null }> => {
    try {
      const { data, error } = await supabase
        .from('hostel_bed_categories')
        .insert({ hostel_id: hostelId, name, price_adjustment: priceAdjustment })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as HostelBedCategory };
    } catch (e) {
      console.error('Error creating hostel bed category:', e);
      return { success: false, data: null };
    }
  },

  updateCategory: async (id: string, updates: { name?: string; price_adjustment?: number }): Promise<{ success: boolean; data: HostelBedCategory | null }> => {
    try {
      const { data, error } = await supabase
        .from('hostel_bed_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as HostelBedCategory };
    } catch (e) {
      console.error('Error updating hostel bed category:', e);
      return { success: false, data: null };
    }
  },

  deleteCategory: async (id: string): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('hostel_bed_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error deleting hostel bed category:', e);
      return { success: false };
    }
  },
};
