import { Location } from '../types';
import { GeographicRegion } from './regions';
import { logger } from '../logger';
import {
  secureRandom,
  secureRandomInt,
  distributedRandom,
  randomAngle,
  randomDistance
} from './crypto';
import {
  optimizedRegionManager,
  getRegionsByCountryOptimized,
  getRandomRegionOptimized
} from './regions';

/**
 * Validate if coordinates are within valid ranges
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}

/**
 * Validate if a location object is valid
 */
export function isValidLocation(location: Location): boolean {
  if (!location || typeof location !== 'object') return false;
  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') return false;
  return isValidCoordinate(location.lat, location.lng);
}

/**
 * Distribution strategies for location generation
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
  const distance = randomDistance(region.radius, 0.5);
  const angle = randomAngle(0.1);

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
  const distance = randomDistance(region.radius, 3);
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
    const distance = secureRandom() * region.radius * 0.7;
    const angle = randomAngle(0.2);

    const latOffset = (distance * Math.cos(angle)) / 111;
    const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

    candidates.push({
      lat: region.lat + latOffset,
      lng: region.lng + lngOffset
    });
  }

  return candidates[secureRandomInt(0, candidates.length - 1)];
}

/**
 * Generate a scattered location (avoid clustering)
 */
function generateScatteredLocation(region: GeographicRegion): Location {
  const r1 = distributedRandom(5);
  const r2 = distributedRandom(5);
  const r3 = distributedRandom(3);

  const distance = Math.sqrt(r1) * region.radius;
  const angle = r2 * 2 * Math.PI + (r3 - 0.5) * 0.5;

  const latOffset = (distance * Math.cos(angle)) / 111;
  const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

  return {
    lat: region.lat + latOffset,
    lng: region.lng + lngOffset
  };
}

/**
 * Generate a random location within a specified region with enhanced randomness
 * OPTIMIZED VERSION - Uses the same core algorithm but with better region selection
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
      const jitterLat = (secureRandom() - 0.5) * 0.001;
      const jitterLng = (secureRandom() - 0.5) * 0.001;

      location.lat += jitterLat;
      location.lng += jitterLng;

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
 * OPTIMIZED: Generate a random location from all available regions
 * Uses O(log n) weighted selection instead of O(n) linear scan
 */
export function generateRandomLocation(maxAttempts: number = 25): Location {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Use optimized weighted random selection - O(log n) instead of O(n)
      const selectedRegion = getRandomRegionOptimized();

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
 * OPTIMIZED: Generate a random location from a specific country
 * Uses O(1) hash map lookup instead of O(n) filter operation
 */
export function generateLocationByCountry(countryName: string, maxAttempts: number = 25): Location {
  if (!countryName || typeof countryName !== 'string') {
    throw new Error('Invalid country name provided');
  }

  // Use optimized country lookup - O(1) hash map + fuzzy search fallback
  const countryRegions = getRegionsByCountryOptimized(countryName);
  if (countryRegions.length === 0) {
    logger.error('No regions found for country, falling back to random', { countryName }, 'LocationGenerator');
    return generateRandomLocation(maxAttempts);
  }

  // Shuffle regions using Fisher-Yates algorithm for better randomness
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
          strategy = secureRandom() < 0.5 ? DistributionStrategy.SCATTERED : DistributionStrategy.EDGE_BIASED;
        } else if (region.radius < 50) {
          strategy = secureRandom() < 0.5 ? DistributionStrategy.UNIFORM : DistributionStrategy.CENTER_BIASED;
        } else {
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

/**
 * Benchmark the location generation performance
 */
export function benchmarkLocationGeneration(iterations: number = 1000) {
  console.log(`🚀 Benchmarking location generation with ${iterations} iterations...`);
  
  // Benchmark random location generation
  const start1 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateRandomLocation();
  }
  const time1 = performance.now() - start1;

  // Benchmark country-specific generation
  const start2 = performance.now();
  for (let i = 0; i < iterations; i++) {
    generateLocationByCountry('India');
  }
  const time2 = performance.now() - start2;

  console.log(`Random Generation: ${time1.toFixed(2)}ms (${(iterations/time1*1000).toFixed(0)} ops/sec)`);
  console.log(`Country Generation: ${time2.toFixed(2)}ms (${(iterations/time2*1000).toFixed(0)} ops/sec)`);
  
  // Show region manager stats
  console.log('📊 Region Manager Stats:', optimizedRegionManager.getStats());
}

// Export distribution strategies for external use
export { DistributionStrategy };