import { Location } from '../types';
import { calculateDistance } from '../utils';
import { GEOGRAPHIC_REGIONS, GeographicRegion } from './regions';

/**
 * Generate a random location within a specified region
 * @param region - The geographic region to generate location within
 * @returns A random location within the region
 */
export function generateLocationInRegion(region: GeographicRegion): Location {
	// Generate random point within the region using polar coordinates
	const angle = Math.random() * 2 * Math.PI;
	const distance = Math.random() * region.radius;

	// Convert to lat/lng coordinates
	// Rough conversion: 1 degree ≈ 111 km
	const lat = region.lat + (distance * Math.cos(angle)) / 111;
	const lng = region.lng + (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

	return { lat, lng };
}

/**
 * Generate a random location from all available regions
 * @returns A random location from a randomly selected region
 */
export function generateRandomLocation(): Location {
	const region = GEOGRAPHIC_REGIONS[Math.floor(Math.random() * GEOGRAPHIC_REGIONS.length)];
	return generateLocationInRegion(region);
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
