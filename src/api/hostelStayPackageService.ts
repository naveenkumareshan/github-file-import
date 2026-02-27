
import { supabase } from '@/integrations/supabase/client';

export type DurationType = 'daily' | 'weekly' | 'monthly';

export interface StayPackage {
  id: string;
  hostel_id: string;
  name: string;
  min_months: number;
  discount_percentage: number;
  deposit_months: number;
  lock_in_months: number;
  notice_months: number;
  description: string;
  is_active: boolean;
  display_order: number;
  duration_type: DurationType;
  created_at: string;
}

export interface CreateStayPackageData {
  hostel_id: string;
  name: string;
  min_months: number;
  discount_percentage: number;
  deposit_months: number;
  lock_in_months: number;
  notice_months: number;
  description?: string;
  display_order?: number;
  duration_type?: DurationType;
}

export const hostelStayPackageService = {
  getPackages: async (hostelId: string, durationType?: DurationType): Promise<StayPackage[]> => {
    let query = supabase
      .from('hostel_stay_packages')
      .select('*')
      .eq('hostel_id', hostelId)
      .eq('is_active', true);
    if (durationType) query = query.eq('duration_type', durationType);
    const { data, error } = await query.order('display_order', { ascending: true });
    if (error) throw error;
    return (data || []) as StayPackage[];
  },

  getAllPackages: async (hostelId: string): Promise<StayPackage[]> => {
    const { data, error } = await supabase
      .from('hostel_stay_packages')
      .select('*')
      .eq('hostel_id', hostelId)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return (data || []) as StayPackage[];
  },

  createPackage: async (packageData: CreateStayPackageData): Promise<StayPackage> => {
    const { data, error } = await supabase
      .from('hostel_stay_packages')
      .insert(packageData)
      .select()
      .single();
    if (error) throw error;
    return data as StayPackage;
  },

  updatePackage: async (id: string, packageData: Partial<CreateStayPackageData & { is_active: boolean }>): Promise<StayPackage> => {
    const { data, error } = await supabase
      .from('hostel_stay_packages')
      .update(packageData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as StayPackage;
  },

  deletePackage: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('hostel_stay_packages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  reorderPackages: async (hostelId: string, orderedIds: string[]): Promise<void> => {
    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from('hostel_stay_packages')
        .update({ display_order: i })
        .eq('id', orderedIds[i])
        .eq('hostel_id', hostelId);
    }
  },
};
