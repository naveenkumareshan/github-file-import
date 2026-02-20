
import axios from './axiosConfig';

export interface LocationFilters {
  page?: number;
  limit?: number;
  search?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
}

export interface Country {
  _id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface State {
  _id: string;
  name: string;
  code: string;
  countryId: Country;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  _id: string;
  name: string;
  stateId: State;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  _id: string;
  name: string;
  cityId: City;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const locationsService = {
  // Countries
  getCountries: async (filters?: LocationFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      
      const response = await axios.get(`/admin/locations/countries?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get countries error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  createCountry: async (data: { name: string; code: string }) => {
    try {
      const response = await axios.post('/admin/locations/countries', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create country error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  updateCountry: async (id: string, data: Partial<Country>) => {
    try {
      const response = await axios.put(`/admin/locations/countries/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update country error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  deleteCountry: async (id: string) => {
    try {
      const response = await axios.delete(`/admin/locations/countries/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete country error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // States
  getStates: async (filters?: LocationFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.countryId) params.append('countryId', filters.countryId);
      
      const response = await axios.get(`/admin/locations/states?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get states error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  createState: async (data: { name: string; code: string; countryId: string }) => {
    try {
      const response = await axios.post('/admin/locations/states', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create state error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  updateState: async (id: string, data: Partial<State>) => {
    try {
      const response = await axios.put(`/admin/locations/states/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update state error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  deleteState: async (id: string) => {
    try {
      const response = await axios.delete(`/admin/locations/states/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete state error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Cities
  getCities: async (filters?: LocationFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.stateId) params.append('stateId', filters.stateId);
      
      const response = await axios.get(`/admin/locations/cities?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get cities error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  createCity: async (data: { name: string; stateId: string; latitude?: number; longitude?: number }) => {
    try {
      const response = await axios.post('/admin/locations/cities', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create city error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  updateCity: async (id: string, data: Partial<City>) => {
    try {
      const response = await axios.put(`/admin/locations/cities/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update city error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  deleteCity: async (id: string) => {
    try {
      const response = await axios.delete(`/admin/locations/cities/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete city error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Areas
  getAreas: async (filters?: LocationFilters) => {
    try {
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.search) params.append('search', filters.search);
      if (filters?.cityId) params.append('cityId', filters.cityId);
      
      const response = await axios.get(`/admin/locations/areas?${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get areas error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  createArea: async (data: { name: string; cityId: string; pincode?: string; latitude?: number; longitude?: number }) => {
    try {
      const response = await axios.post('/admin/locations/areas', data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Create area error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  updateArea: async (id: string, data: Partial<Area>) => {
    try {
      const response = await axios.put(`/admin/locations/areas/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Update area error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  deleteArea: async (id: string) => {
    try {
      const response = await axios.delete(`/admin/locations/areas/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Delete area error:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  }
};
