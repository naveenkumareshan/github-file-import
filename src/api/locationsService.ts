import { supabase } from '@/integrations/supabase/client';

export interface LocationFilters {
  page?: number;
  limit?: number;
  search?: string;
  stateId?: string;
  cityId?: string;
}

export interface State {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface City {
  id: string;
  name: string;
  state_id: string;
  state?: State;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  city_id: string;
  city?: City;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
}

// Keep Country export for backward compat but it's unused now
export interface Country {
  _id: string;
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const locationsService = {
  // States
  getStates: async (filters?: LocationFilters) => {
    try {
      let query = supabase.from('states').select('*').eq('is_active', true).order('name');
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters?.limit) query = query.limit(filters.limit);
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get states error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  getAllStates: async () => {
    try {
      const { data, error } = await supabase.from('states').select('*').order('name');
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get all states error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  createState: async (stateData: { name: string; code: string }) => {
    try {
      const { data, error } = await supabase.from('states').insert(stateData).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Create state error:', error);
      return { success: false, error: error.message };
    }
  },

  updateState: async (id: string, updates: Partial<State>) => {
    try {
      const { data, error } = await supabase.from('states').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Update state error:', error);
      return { success: false, error: error.message };
    }
  },

  deactivateState: async (id: string) => {
    try {
      const { error } = await supabase.from('states').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Deactivate state error:', error);
      return { success: false, error: error.message };
    }
  },

  // Cities
  getCities: async (filters?: LocationFilters) => {
    try {
      let query = supabase.from('cities').select('*, state:states(id, name, code)').eq('is_active', true).order('name');
      if (filters?.stateId) query = query.eq('state_id', filters.stateId);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters?.limit) query = query.limit(filters.limit);
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get cities error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  createCity: async (cityData: { name: string; state_id: string; latitude?: number; longitude?: number }) => {
    try {
      const { data, error } = await supabase.from('cities').insert(cityData).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Create city error:', error);
      return { success: false, error: error.message };
    }
  },

  updateCity: async (id: string, updates: Partial<City>) => {
    try {
      const { data, error } = await supabase.from('cities').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Update city error:', error);
      return { success: false, error: error.message };
    }
  },

  deactivateCity: async (id: string) => {
    try {
      const { error } = await supabase.from('cities').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Deactivate city error:', error);
      return { success: false, error: error.message };
    }
  },

  // Areas
  getAreas: async (filters?: LocationFilters) => {
    try {
      let query = supabase.from('areas').select('*, city:cities(id, name)').eq('is_active', true).order('name');
      if (filters?.cityId) query = query.eq('city_id', filters.cityId);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters?.limit) query = query.limit(filters.limit);
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error: any) {
      console.error('Get areas error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  createArea: async (areaData: { name: string; city_id: string; pincode?: string; latitude?: number; longitude?: number }) => {
    try {
      const { data, error } = await supabase.from('areas').insert(areaData).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Create area error:', error);
      return { success: false, error: error.message };
    }
  },

  updateArea: async (id: string, updates: Partial<Area>) => {
    try {
      const { data, error } = await supabase.from('areas').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Update area error:', error);
      return { success: false, error: error.message };
    }
  },

  deactivateArea: async (id: string) => {
    try {
      const { error } = await supabase.from('areas').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Deactivate area error:', error);
      return { success: false, error: error.message };
    }
  },

  // Legacy compat - unused but kept to avoid import errors
  getCountries: async (_filters?: LocationFilters) => {
    return { success: true, data: { data: [], pagination: { pages: 0 } } };
  },
  createCountry: async (_data: any) => ({ success: false, error: 'Countries not supported' }),
  updateCountry: async (_id: string, _data: any) => ({ success: false, error: 'Countries not supported' }),
  deleteCountry: async (_id: string) => ({ success: false, error: 'Countries not supported' }),
  deleteState: async (_id: string) => ({ success: false, error: 'Use deactivateState instead' }),
  deleteCity: async (_id: string) => ({ success: false, error: 'Use deactivateCity instead' }),
  deleteArea: async (_id: string) => ({ success: false, error: 'Use deactivateArea instead' }),
};
