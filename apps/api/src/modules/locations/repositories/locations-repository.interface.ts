export const LOCATIONS_REPOSITORY = Symbol('LOCATIONS_REPOSITORY');

export interface DistrictWithCity {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
}

export interface ILocationsRepository {
  findAllDistricts(): Promise<DistrictWithCity[]>;
}