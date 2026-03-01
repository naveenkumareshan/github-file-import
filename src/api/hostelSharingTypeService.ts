import { supabase } from '@/integrations/supabase/client';

export interface HostelSharingType {
  id: string;
  hostel_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export const hostelSharingTypeService = {
  getSharingTypes: async (hostelId: string): Promise<{ success: boolean; data: HostelSharingType[] }> => {
    try {
      const { data, error } = await supabase
        .from('hostel_sharing_types')
        .select('*')
        .eq('hostel_id', hostelId)
        .eq('is_active', true)
        .order('capacity');
      if (error) throw error;
      return { success: true, data: (data || []) as unknown as HostelSharingType[] };
    } catch (e) {
      console.error('Error fetching hostel sharing types:', e);
      return { success: false, data: [] };
    }
  },

  createSharingType: async (hostelId: string, name: string, capacity: number): Promise<{ success: boolean; data: HostelSharingType | null }> => {
    try {
      const { data, error } = await supabase
        .from('hostel_sharing_types')
        .insert({ hostel_id: hostelId, name, capacity } as any)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as unknown as HostelSharingType };
    } catch (e) {
      console.error('Error creating hostel sharing type:', e);
      return { success: false, data: null };
    }
  },

  updateSharingType: async (id: string, updates: { name?: string; capacity?: number }): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('hostel_sharing_types')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error updating hostel sharing type:', e);
      return { success: false };
    }
  },

  deleteSharingType: async (id: string): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('hostel_sharing_types')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error deleting hostel sharing type:', e);
      return { success: false };
    }
  },
};
