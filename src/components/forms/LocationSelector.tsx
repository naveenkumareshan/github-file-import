import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useLocations } from '@/hooks/useLocations';
import { Country, State, City, Area } from '@/api/locationsService';

interface LocationSelectorProps {
  selectedCountry?: string;
  selectedState?: string;
  selectedCity?: string;
  selectedArea?: string;
  onCountryChange?: (countryId: string) => void;
  onStateChange?: (stateId: string) => void;
  onCityChange?: (cityId: string) => void;
  onAreaChange?: (areaId: string) => void;
  showCountry?: boolean;
  showState?: boolean;
  showCity?: boolean;
  showArea?: boolean;
  disabled?: boolean;
}

const LocationSelectorComponent: React.FC<LocationSelectorProps> = ({
  selectedCountry,
  selectedState,
  selectedCity,
  selectedArea,
  onCountryChange,
  onStateChange,
  onCityChange,
  onAreaChange,
  showCountry = true,
  showState = true,
  showCity = true,
  showArea = true,
  disabled = false
}) => {
  const { countries, getStatesByCountry, getCitiesByState, getAreasByCity } = useLocations();

  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    if (selectedCountry) {
      loadStates(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      loadCities(selectedState);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedCity) {
      loadAreas(selectedCity);
    } else {
      setAreas([]);
    }
  }, [selectedCity]);

  const loadStates = async (countryId: string) => {
    const statesData = await getStatesByCountry(countryId);
    setStates(statesData);
  };

  const loadCities = async (stateId: string) => {
    const citiesData = await getCitiesByState(stateId);
    setCities(citiesData);
  };

  const loadAreas = async (cityId: string) => {
    const areasData = await getAreasByCity(cityId);
    setAreas(areasData);
  };

  const handleCountryChange = (countryId: string) => {
    onCountryChange?.(countryId);
    onStateChange?.('');
    onCityChange?.('');
    onAreaChange?.('');
  };

  const handleStateChange = (stateId: string) => {
    onStateChange?.(stateId);
    onCityChange?.('');
    onAreaChange?.('');
  };

  const handleCityChange = (cityId: string) => {
    onCityChange?.(cityId);
    onAreaChange?.('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {showCountry && (
        <div>
          <label className="text-sm font-medium mb-1 block">Country</label>
          <Select value={selectedCountry} onValueChange={handleCountryChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country._id} value={country._id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showState && (
        <div>
          <label className="text-sm font-medium mb-1 block">State</label>
          <Select value={selectedState} onValueChange={handleStateChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state._id} value={state._id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showCity && (
        <div>
          <label className="text-sm font-medium mb-1 block">City</label>
          <Select value={selectedCity} onValueChange={handleCityChange} >
            <SelectTrigger>
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city._id} value={city._id}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showArea && (
        <div>
          <label className="text-sm font-medium mb-1 block">Area</label>
          <Select value={selectedArea} onValueChange={onAreaChange} disabled={disabled || !selectedCity}>
            <SelectTrigger>
              <SelectValue placeholder="Select area" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area._id} value={area._id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

// ✅ Memoized export with custom prop comparison
export const LocationSelector = React.memo(LocationSelectorComponent);
