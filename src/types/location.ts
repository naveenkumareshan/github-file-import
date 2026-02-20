
export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface State {
  id: string;
  name: string;
  code: string;
  countryId: string;
}

export interface City {
  id: string;
  name: string;
  stateId: string;
  latitude?: number;
  longitude?: number;
}

export interface Area {
  id: string;
  name: string;
  cityId: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationHierarchy {
  country: Country;
  state: State;
  city: City;
  area?: Area;
}
