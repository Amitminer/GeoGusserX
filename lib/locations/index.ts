import { Location } from '../types';
import { calculateDistance } from '../utils';
import { GEOGRAPHIC_REGIONS, GeographicRegion, getRegionsByCountry } from './regions';
import { logger } from '../logger';

/**
 * Validate if coordinates are within valid ranges
 * @param lat - Latitude to validate
 * @param lng - Longitude to validate
 * @returns True if coordinates are valid
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
	// Check if coordinates are within valid ranges
	if (lat < -90 || lat > 90) return false;
	if (lng < -180 || lng > 180) return false;
	
	// Check if coordinates are not NaN or Infinity
	if (!isFinite(lat) || !isFinite(lng)) return false;
	
	// Check if coordinates are not exactly 0,0 (often indicates invalid data)
	if (lat === 0 && lng === 0) return false;
	
	return true;
}

/**
 * Validate if a location object is valid
 * @param location - Location to validate
 * @returns True if location is valid
 */
export function isValidLocation(location: Location): boolean {
	if (!location || typeof location !== 'object') return false;
	if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return false;
	return isValidCoordinate(location.lat, location.lng);
}

/**
 * Generate a random location within a specified region with validation
 * @param region - The geographic region to generate location within
 * @param maxAttempts - Maximum attempts to generate a valid location
 * @returns A valid random location within the region
 */
export function generateLocationInRegion(region: GeographicRegion, maxAttempts: number = 10): Location {
	if (!region || typeof region !== 'object') {
		throw new Error('Invalid region provided');
	}
	
	if (!isValidCoordinate(region.lat, region.lng)) {
		throw new Error(`Invalid region coordinates: ${region.lat}, ${region.lng}`);
	}
	
	if (region.radius <= 0 || region.radius > 1000) {
		throw new Error(`Invalid region radius: ${region.radius}km`);
	}
	
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			// Generate random point within the region using polar coordinates
			const angle = Math.random() * 2 * Math.PI;
			const distance = Math.random() * region.radius;

			// Convert to lat/lng coordinates
			// Rough conversion: 1 degree ≈ 111 km
			const latOffset = (distance * Math.cos(angle)) / 111;
			const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));
			
			const lat = region.lat + latOffset;
			const lng = region.lng + lngOffset;

			// Validate generated coordinates
			if (isValidCoordinate(lat, lng)) {
				const location = { lat, lng };
				logger.debug('Generated valid location', { location, region: region.name, attempt }, 'LocationGenerator');
				return location;
			}
			
			logger.warn('Generated invalid coordinates', { lat, lng, region: region.name, attempt }, 'LocationGenerator');
		} catch (error) {
			logger.warn('Error generating location', { error, region: region.name, attempt }, 'LocationGenerator');
		}
	}
	
	// Fallback to region center if all attempts fail
	logger.warn('Failed to generate valid location, using region center', { region: region.name }, 'LocationGenerator');
	return { lat: region.lat, lng: region.lng };
}

/**
 * Generate a random location from all available regions with validation
 * @param maxAttempts - Maximum attempts to generate a valid location
 * @returns A valid random location from a randomly selected region
 */
export function generateRandomLocation(maxAttempts: number = 20): Location {
	if (GEOGRAPHIC_REGIONS.length === 0) {
		throw new Error('No geographic regions available');
	}
	
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			const region = GEOGRAPHIC_REGIONS[Math.floor(Math.random() * GEOGRAPHIC_REGIONS.length)];
			const location = generateLocationInRegion(region, 5);
			
			if (isValidLocation(location)) {
				return location;
			}
		} catch (error) {
			logger.warn('Failed to generate location from region', { error, attempt }, 'LocationGenerator');
		}
	}
	
	// Ultimate fallback to a known good location (New York City)
	logger.error('Failed to generate any valid location, using fallback', undefined, 'LocationGenerator');
	return { lat: 40.7128, lng: -74.0060 };
}

/**
 * Get regions by continent
 * @param continent - The continent to filter by
 * @returns Array of regions in the specified continent
 */
export function getRegionsByContinent(continent: string): GeographicRegion[] {
	return GEOGRAPHIC_REGIONS.filter(region => region.continent === continent);
}

/**
 * Get all available continents
 * @returns Array of unique continent names
 */
export function getAvailableContinents(): string[] {
	return [...new Set(GEOGRAPHIC_REGIONS.map(region => region.continent))];
}

/**
 * Generate a random location from a specific continent
 * @param continent - The continent to generate location from
 * @returns A random location from the specified continent
 */
export function generateLocationByContinent(continent: string): Location {
	const continentRegions = getRegionsByContinent(continent);
	if (continentRegions.length === 0) {
		throw new Error(`No regions found for continent: ${continent}`);
	}

	const region = continentRegions[Math.floor(Math.random() * continentRegions.length)];
	return generateLocationInRegion(region);
}

/**
 * Get region information by name
 * @param name - The name of the region
 * @returns The region object or undefined if not found
 */
export function getRegionByName(name: string): GeographicRegion | undefined {
	return GEOGRAPHIC_REGIONS.find(region => region.name === name);
}

/**
 * Calculate the approximate distance between two locations in kilometers
 * Uses the calculateDistance utility function
 * @param loc1 - First location
 * @param loc2 - Second location
 * @returns Distance in kilometers
 */
export function calculateLocationDistance(loc1: Location, loc2: Location): number {
	return calculateDistance(loc1.lat, loc1.lng, loc2.lat, loc2.lng);
}

/**
 * Check if a location is within a region's bounds
 * @param location - The location to check
 * @param region - The region to check against
 * @returns True if the location is within the region
 */
export function isLocationInRegion(location: Location, region: GeographicRegion): boolean {
	const distance = calculateLocationDistance(location, { lat: region.lat, lng: region.lng });
	return distance <= region.radius;
}

/**
 * Generate a random location from a specific country with validation
 * @param countryName - The name of the country to generate location from
 * @param maxAttempts - Maximum attempts to generate a valid location
 * @returns A valid random location from the specified country
 */
export function generateLocationByCountry(countryName: string, maxAttempts: number = 20): Location {
	if (!countryName || typeof countryName !== 'string') {
		throw new Error('Invalid country name provided');
	}
	
	const countryRegions = getRegionsByCountry(countryName);
	if (countryRegions.length === 0) {
		logger.error('No regions found for country, falling back to random', { countryName }, 'LocationGenerator');
		return generateRandomLocation(maxAttempts);
	}

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			const region = countryRegions[Math.floor(Math.random() * countryRegions.length)];
			const location = generateLocationInRegion(region, 5);
			
			if (isValidLocation(location)) {
				return location;
			}
		} catch (error) {
			logger.warn('Failed to generate location from country region', { error, countryName, attempt }, 'LocationGenerator');
		}
	}
	
	// Fallback to first region center if all attempts fail
	logger.warn('Failed to generate valid location for country, using region center', { countryName }, 'LocationGenerator');
	const fallbackRegion = countryRegions[0];
	return { lat: fallbackRegion.lat, lng: fallbackRegion.lng };
}
