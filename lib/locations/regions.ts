import regionsData from './regions.json';

/**
 * Geographic region definition for location generation
 */
export interface GeographicRegion {
	lat: number;
	lng: number;
	radius: number;
	name: string;
	continent: string;
	type: 'country' | 'state' | 'region';
}

/**
 * Interface for the JSON structure
 */
interface RegionsData {
	regions: GeographicRegion[];
}

/**
 * Load geographic regions from JSON file
 * Organized by countries and their major states/regions
 */
export const GEOGRAPHIC_REGIONS: GeographicRegion[] = (regionsData as RegionsData).regions;

/**
 * Get all available countries (regions) sorted alphabetically
 */
export function getAvailableCountries(): string[] {
	return [...new Set(GEOGRAPHIC_REGIONS.map(region => region.name))].sort();
}

/**
 * Get regions by country name (case-insensitive)
 */
export function getRegionsByCountry(countryName: string): GeographicRegion[] {
	return GEOGRAPHIC_REGIONS.filter(region => 
		region.name.toLowerCase().includes(countryName.toLowerCase())
	);
}

/**
 * Get regions by type (country, state, region)
 */
export function getRegionsByType(type: 'country' | 'state' | 'region'): GeographicRegion[] {
	return GEOGRAPHIC_REGIONS.filter(region => region.type === type);
}

/**
 * Get all countries (excluding states and regions)
 */
export function getCountriesOnly(): string[] {
	return GEOGRAPHIC_REGIONS
		.filter(region => region.type === 'country')
		.map(region => region.name)
		.sort();
}

/**
 * Get states/regions for a specific country
 */
export function getStatesForCountry(countryName: string): GeographicRegion[] {
	return GEOGRAPHIC_REGIONS.filter(region => 
		(region.type === 'state' || region.type === 'region') &&
		region.name.toLowerCase().includes(countryName.toLowerCase())
	);
}