import { Location } from '../types';
import { GEOGRAPHIC_REGIONS, GeographicRegion, getRegionsByCountry } from './regions';
import { logger } from '../logger';
import {
	secureRandom,
	secureRandomInt,
	distributedRandom,
	randomAngle,
	randomDistance
} from './crypto';

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
 * Enhanced random location generation with multiple distribution strategies
 */
enum DistributionStrategy {
	UNIFORM = 'uniform',
	EDGE_BIASED = 'edge_biased',
	CENTER_BIASED = 'center_biased',
	CLUSTERED = 'clustered',
	SCATTERED = 'scattered'
}

/**
 * Generate a location using uniform distribution within a circle
 */
function generateUniformLocation(region: GeographicRegion): Location {
	// Use square root for uniform distribution in circular area
	const distance = Math.sqrt(distributedRandom()) * region.radius;
	const angle = randomAngle();

	const latOffset = (distance * Math.cos(angle)) / 111;
	const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

	return {
		lat: region.lat + latOffset,
		lng: region.lng + lngOffset
	};
}

/**
 * Generate a location biased towards the edges of the region
 */
function generateEdgeBiasedLocation(region: GeographicRegion): Location {
	const distance = randomDistance(region.radius, 0.5); // Higher chance of edge locations
	const angle = randomAngle(0.1); // Slight bias towards cardinal directions

	const latOffset = (distance * Math.cos(angle)) / 111;
	const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

	return {
		lat: region.lat + latOffset,
		lng: region.lng + lngOffset
	};
}

/**
 * Generate a location biased towards the center of the region
 */
function generateCenterBiasedLocation(region: GeographicRegion): Location {
	const distance = randomDistance(region.radius, 3); // Higher chance of center locations
	const angle = randomAngle();

	const latOffset = (distance * Math.cos(angle)) / 111;
	const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

	return {
		lat: region.lat + latOffset,
		lng: region.lng + lngOffset
	};
}

/**
 * Generate a clustered location (multiple attempts, pick best)
 */
function generateClusteredLocation(region: GeographicRegion): Location {
	const candidates: Location[] = [];
	const clusterCount = secureRandomInt(3, 7);

	for (let i = 0; i < clusterCount; i++) {
		const distance = secureRandom() * region.radius * 0.7; // Stay closer to center
		const angle = randomAngle(0.2);

		const latOffset = (distance * Math.cos(angle)) / 111;
		const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

		candidates.push({
			lat: region.lat + latOffset,
			lng: region.lng + lngOffset
		});
	}

	// Return a random candidate from the cluster
	return candidates[secureRandomInt(0, candidates.length - 1)];
}

/**
 * Generate a scattered location (avoid clustering)
 */
function generateScatteredLocation(region: GeographicRegion): Location {
	// Use multiple random sources for better scattering
	const r1 = distributedRandom(5);
	const r2 = distributedRandom(5);
	const r3 = distributedRandom(3);

	const distance = Math.sqrt(r1) * region.radius;
	const angle = r2 * 2 * Math.PI + (r3 - 0.5) * 0.5; // Add some angle jitter

	const latOffset = (distance * Math.cos(angle)) / 111;
	const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

	return {
		lat: region.lat + latOffset,
		lng: region.lng + lngOffset
	};
}

/**
 * Generate a random location within a specified region with enhanced randomness
 * @param region - The geographic region to generate location within
 * @param strategy - Distribution strategy to use
 * @param maxAttempts - Maximum attempts to generate a valid location
 * @returns A valid random location within the region
 */
export function generateLocationInRegion(
	region: GeographicRegion,
	strategy: DistributionStrategy = DistributionStrategy.UNIFORM,
	maxAttempts: number = 15
): Location {
	if (!region || typeof region !== 'object') {
		throw new Error('Invalid region provided');
	}

	if (!isValidCoordinate(region.lat, region.lng)) {
		throw new Error(`Invalid region coordinates: ${region.lat}, ${region.lng}`);
	}

	if (region.radius <= 0 || region.radius > 1000) {
		throw new Error(`Invalid region radius: ${region.radius}km`);
	}

	// Randomly vary the distribution strategy for more unpredictability
	const actualStrategy = secureRandom() < 0.1 ?
		Object.values(DistributionStrategy)[secureRandomInt(0, Object.values(DistributionStrategy).length - 1)] :
		strategy;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			let location: Location;

			switch (actualStrategy) {
				case DistributionStrategy.EDGE_BIASED:
					location = generateEdgeBiasedLocation(region);
					break;
				case DistributionStrategy.CENTER_BIASED:
					location = generateCenterBiasedLocation(region);
					break;
				case DistributionStrategy.CLUSTERED:
					location = generateClusteredLocation(region);
					break;
				case DistributionStrategy.SCATTERED:
					location = generateScatteredLocation(region);
					break;
				default:
					location = generateUniformLocation(region);
			}

			// Add small random jitter to avoid exact patterns
			const jitterLat = (secureRandom() - 0.5) * 0.001; // ~100m jitter
			const jitterLng = (secureRandom() - 0.5) * 0.001;

			location.lat += jitterLat;
			location.lng += jitterLng;

			// Validate generated coordinates
			if (isValidCoordinate(location.lat, location.lng)) {
				logger.debug('Generated valid location', {
					location,
					region: region.name,
					strategy: actualStrategy,
					attempt
				}, 'LocationGenerator');
				return location;
			}

			logger.warn('Generated invalid coordinates', {
				location,
				region: region.name,
				strategy: actualStrategy,
				attempt
			}, 'LocationGenerator');
		} catch (error) {
			logger.warn('Error generating location', {
				error,
				region: region.name,
				strategy: actualStrategy,
				attempt
			}, 'LocationGenerator');
		}
	}

	// Fallback to region center with small random offset
	logger.warn('Failed to generate valid location, using region center with offset', {
		region: region.name
	}, 'LocationGenerator');

	const offsetLat = (secureRandom() - 0.5) * 0.01;
	const offsetLng = (secureRandom() - 0.5) * 0.01;

	return {
		lat: region.lat + offsetLat,
		lng: region.lng + offsetLng
	};
}

/**
 * Generate a random location from all available regions with enhanced randomness
 * @param maxAttempts - Maximum attempts to generate a valid location
 * @returns A valid random location from a randomly selected region
 */
export function generateRandomLocation(maxAttempts: number = 25): Location {
	if (GEOGRAPHIC_REGIONS.length === 0) {
		throw new Error('No geographic regions available');
	}

	// Use weighted random selection - some regions may be preferred
	const regionWeights = GEOGRAPHIC_REGIONS.map((region, index) => {
		// Larger regions get slightly higher weight, but not too much
		const sizeWeight = Math.log(region.radius + 1) / 10;
		// Add some random variance to weights
		const randomWeight = secureRandom() * 0.5;
		return { index, weight: 1 + sizeWeight + randomWeight };
	});

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			// Weighted random selection
			const totalWeight = regionWeights.reduce((sum, item) => sum + item.weight, 0);
			const randomWeight = secureRandom() * totalWeight;

			let weightSum = 0;
			let selectedRegion: GeographicRegion | null = null;

			for (const item of regionWeights) {
				weightSum += item.weight;
				if (randomWeight <= weightSum) {
					selectedRegion = GEOGRAPHIC_REGIONS[item.index];
					break;
				}
			}

			// Fallback to simple random if weighted selection fails
			if (!selectedRegion) {
				selectedRegion = GEOGRAPHIC_REGIONS[secureRandomInt(0, GEOGRAPHIC_REGIONS.length - 1)];
			}

			// Randomly choose distribution strategy
			const strategies = Object.values(DistributionStrategy);
			const randomStrategy = strategies[secureRandomInt(0, strategies.length - 1)];

			const location = generateLocationInRegion(selectedRegion, randomStrategy, 8);

			if (isValidLocation(location)) {
				return location;
			}
		} catch (error) {
			logger.warn('Failed to generate location from region', { error, attempt }, 'LocationGenerator');
		}
	}

	// Multiple fallback locations to avoid always using the same one
	const fallbackLocations = [
		{ lat: 40.7128, lng: -74.0060 }, // New York City
		{ lat: 51.5074, lng: -0.1278 },  // London
		{ lat: 35.6762, lng: 139.6503 }, // Tokyo
		{ lat: -33.8688, lng: 151.2093 }, // Sydney
		{ lat: 48.8566, lng: 2.3522 },   // Paris
	];

	const fallback = fallbackLocations[secureRandomInt(0, fallbackLocations.length - 1)];

	// Add random offset to fallback location
	const offsetLat = (secureRandom() - 0.5) * 0.02;
	const offsetLng = (secureRandom() - 0.5) * 0.02;

	logger.error('Failed to generate any valid location, using fallback with offset', {
		fallback,
		offset: { lat: offsetLat, lng: offsetLng }
	}, 'LocationGenerator');

	return {
		lat: fallback.lat + offsetLat,
		lng: fallback.lng + offsetLng
	};
}

/**
 * Generate a random location from a specific country with enhanced validation
 * @param countryName - The name of the country to generate location from
 * @param maxAttempts - Maximum attempts to generate a valid location
 * @returns A valid random location from the specified country
 */
export function generateLocationByCountry(countryName: string, maxAttempts: number = 25): Location {
	if (!countryName || typeof countryName !== 'string') {
		throw new Error('Invalid country name provided');
	}

	const countryRegions = getRegionsByCountry(countryName);
	if (countryRegions.length === 0) {
		logger.error('No regions found for country, falling back to random', { countryName }, 'LocationGenerator');
		return generateRandomLocation(maxAttempts);
	}

	// Shuffle regions to avoid always picking the first ones
	const shuffledRegions = [...countryRegions];
	for (let i = shuffledRegions.length - 1; i > 0; i--) {
		const j = secureRandomInt(0, i);
		[shuffledRegions[i], shuffledRegions[j]] = [shuffledRegions[j], shuffledRegions[i]];
	}

	const attemptsPerRegion = Math.max(1, Math.floor(maxAttempts / shuffledRegions.length));

	for (const region of shuffledRegions) {
		for (let attempt = 0; attempt < attemptsPerRegion; attempt++) {
			try {
				// Vary strategy based on region size
				let strategy: DistributionStrategy;
				if (region.radius > 200) {
					// Large regions: prefer scattered or edge-biased
					strategy = secureRandom() < 0.5 ? DistributionStrategy.SCATTERED : DistributionStrategy.EDGE_BIASED;
				} else if (region.radius < 50) {
					// Small regions: prefer uniform or center-biased
					strategy = secureRandom() < 0.5 ? DistributionStrategy.UNIFORM : DistributionStrategy.CENTER_BIASED;
				} else {
					// Medium regions: any strategy
					const strategies = Object.values(DistributionStrategy);
					strategy = strategies[secureRandomInt(0, strategies.length - 1)];
				}

				const location = generateLocationInRegion(region, strategy, 3);

				if (isValidLocation(location)) {
					return location;
				}
			} catch (error) {
				logger.warn('Failed to generate location from country region', {
					error,
					countryName,
					regionName: region.name,
					attempt
				}, 'LocationGenerator');
			}
		}
	}

	// Fallback to first region center with random offset
	logger.warn('Failed to generate valid location for country, using region center', { countryName }, 'LocationGenerator');
	const fallbackRegion = shuffledRegions[0];

	const offsetLat = (secureRandom() - 0.5) * 0.05;
	const offsetLng = (secureRandom() - 0.5) * 0.05;

	return {
		lat: fallbackRegion.lat + offsetLat,
		lng: fallbackRegion.lng + offsetLng
	};
}

// Export distribution strategies for external use
export { DistributionStrategy };