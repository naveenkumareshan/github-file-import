
import { useState, useEffect } from 'react';
import { locationsService, Country, State, City, Area } from '@/api/locationsService';

export const useLocations = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all countries on mount
  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const response = await locationsService.getCountries({ limit: 200 });
      if (response.success) {
        setCountries(response.data.data);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatesByCountry = async (countryId: string): Promise<State[]> => {
    try {
      const response = await locationsService.getStates({ countryId, limit: 200 });
      if (response.success) {
        const statesData = response.data.data;
        setStates(statesData);
        return statesData;
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
        const citiesData = response.data.data;
        setCities(citiesData);
        return citiesData;
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
        const areasData = response.data.data;
        setAreas(areasData);
        return areasData;
      }
      return [];
    } catch (error) {
      console.error('Error loading areas:', error);
      return [];
    }
  };

  const getLocationById = (type: 'country' | 'state' | 'city' | 'area', id: string) => {
    switch (type) {
      case 'country':
        return countries.find(country => country._id === id);
      case 'state':
        return states.find(state => state._id === id);
      case 'city':
        return cities.find(city => city._id === id);
      case 'area':
        return areas.find(area => area._id === id);
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
        if (response.success) {
          results.states = response.data.data;
        }
      }

      if (type === 'city' || !type) {
        const response = await locationsService.getCities({ search: query, limit: 50 });
        if (response.success) {
          results.cities = response.data.data;
        }
      }

      if (type === 'area' || !type) {
        const response = await locationsService.getAreas({ search: query, limit: 50 });
        if (response.success) {
          results.areas = response.data.data;
        }
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    }

    return results;
  };

  return {
    countries,
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
