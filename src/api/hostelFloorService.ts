import { supabase } from '@/integrations/supabase/client';

export interface HostelFloor {
  id: string;
  hostel_id: string;
  name: string;
  floor_order: number;
  is_active: boolean;
  created_at: string;
}

export const hostelFloorService = {
  getFloors: async (hostelId: string): Promise<{ success: boolean; data: HostelFloor[] }> => {
    try {
      const { data, error } = await supabase
        .from('hostel_floors')
        .select('*')
        .eq('hostel_id', hostelId)
        .eq('is_active', true)
        .order('floor_order');
      if (error) throw error;
      return { success: true, data: (data || []) as unknown as HostelFloor[] };
    } catch (e) {
      console.error('Error fetching hostel floors:', e);
      return { success: false, data: [] };
    }
  },

  createFloor: async (hostelId: string, name: string, floorOrder: number): Promise<{ success: boolean; data: HostelFloor | null }> => {
    try {
      const { data, error } = await supabase
        .from('hostel_floors')
        .insert({ hostel_id: hostelId, name, floor_order: floorOrder } as any)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: data as unknown as HostelFloor };
    } catch (e) {
      console.error('Error creating hostel floor:', e);
      return { success: false, data: null };
    }
  },

  updateFloor: async (id: string, updates: { name?: string; floor_order?: number }): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('hostel_floors')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error updating hostel floor:', e);
      return { success: false };
    }
  },

  deleteFloor: async (id: string): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('hostel_floors')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error('Error deleting hostel floor:', e);
      return { success: false };
    }
  },
};
