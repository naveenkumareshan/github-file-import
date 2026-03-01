import { useState, useEffect } from 'react';
import { locationsService, State, City, Area } from '@/api/locationsService';

export const useLocations = () => {
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);

  // Load states on mount
  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    setLoading(true);
    try {
      const response = await locationsService.getStates({ limit: 200 });
      if (response.success) {
        setStates(response.data);
      }
    } catch (error) {
      console.error('Error loading states:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatesByCountry = async (_countryId?: string): Promise<State[]> => {
    // Country is hardcoded as India, so just return all states
    try {
      const response = await locationsService.getStates({ limit: 200 });
      if (response.success) {
        setStates(response.data);
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error loading states:', error);
      return [];
    }
  };

  const getCitiesByState = async (stateId: string): Promise<City[]> => {
    try {
      const response = await locationsService.getCities({ stateId, limit: 200 });
      if (response.success) {
        setCities(response.data as any);
        return response.data as any;
      }
      return [];
    } catch (error) {
      console.error('Error loading cities:', error);
      return [];
    }
  };

  const getAreasByCity = async (cityId: string): Promise<Area[]> => {
    try {
      const response = await locationsService.getAreas({ cityId, limit: 200 });
      if (response.success) {
        setAreas(response.data as any);
        return response.data as any;
      }
      return [];
    } catch (error) {
      console.error('Error loading areas:', error);
      return [];
    }
  };

  const getLocationById = (type: 'state' | 'city' | 'area', id: string) => {
    switch (type) {
      case 'state':
        return states.find(state => state.id === id);
      case 'city':
        return cities.find(city => city.id === id);
      case 'area':
        return areas.find(area => area.id === id);
      default:
        return null;
    }
  };

  const searchLocations = async (query: string, type?: 'state' | 'city' | 'area') => {
    const results = {
      states: [] as State[],
      cities: [] as City[],
      areas: [] as Area[]
    };

    try {
      if (type === 'state' || !type) {
        const response = await locationsService.getStates({ search: query, limit: 50 });
        if (response.success) results.states = response.data;
      }
      if (type === 'city' || !type) {
        const response = await locationsService.getCities({ search: query, limit: 50 });
        if (response.success) results.cities = response.data as any;
      }
      if (type === 'area' || !type) {
        const response = await locationsService.getAreas({ search: query, limit: 50 });
        if (response.success) results.areas = response.data as any;
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    }

    return results;
  };

  return {
    countries: [], // empty for backward compat
    states,
    cities,
    areas,
    loading,
    getStatesByCountry,
    getCitiesByState,
    getAreasByCity,
    getLocationById,
    searchLocations
  };
};
