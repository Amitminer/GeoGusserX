import { Location } from '../types';
import { GeographicRegion } from './regions';
import { logger } from '../logger';
import {
  secureRandom,
  secureRandomInt,
  distributedRandom,
  randomAngle,
  randomDistance,
  generateEntropySeed
} from './crypto';
import {
  getRegionsByCountryOptimized,
  getRandomRegion
} from './regions';

/**
 * Validate if coordinates are within valid ranges
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  if (!isFinite(lat) || !isFinite(lng)) return false;
  // A location of (0, 0) is often an indicator of an error or uninitialized data.
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
 * Defines the different strategies for distributing the generated locations within a region.
 * This allows for more varied and interesting gameplay, as some strategies might produce
 * more challenging locations than others.
 */
enum DistributionStrategy {
  UNIFORM = 'uniform', // Evenly distributed across the region.
  EDGE_BIASED = 'edge_biased', // More likely to be near the region's border.
  CENTER_BIASED = 'center_biased', // More likely to be near the region's center.
  CLUSTERED = 'clustered', // Locations are grouped together in a small area.
  SCATTERED = 'scattered' // Locations are spread far apart.
}

/**
 * Generates a location using a uniform distribution within a circular region.
 * This method uses square root scaling on a random number to ensure that the
 * points are evenly distributed over the area of the circle, not just along its radius.
 * @param region The geographic region to generate a location in.
 * @returns A random location with a uniform distribution.
 */
function generateUniformLocation(region: GeographicRegion): Location {
  const entropySeed = generateEntropySeed();
  const distance = Math.sqrt(distributedRandom(5)) * region.radius * (0.7 + entropySeed * 0.3);
  const angle = randomAngle(0.05); // Slight bias for more natural distribution

  const latOffset = (distance * Math.cos(angle)) / 111;
  const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

  return {
    lat: region.lat + latOffset,
    lng: region.lng + lngOffset
  };
}

/**
 * Generates a location that is biased towards the edges of the region.
 * This can create more challenging scenarios where the player is near a border.
 * @param region The geographic region.
 * @returns A location biased towards the edge of the region.
 */
function generateEdgeBiasedLocation(region: GeographicRegion): Location {
  const entropySeed = generateEntropySeed();
  const distance = randomDistance(region.radius, 0.5 + entropySeed * 0.3);
  const angle = randomAngle(0.1 + entropySeed * 0.1);

  const latOffset = (distance * Math.cos(angle)) / 111;
  const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));

  return {
    lat: region.lat + latOffset,
    lng: region.lng + lngOffset
  };
}

/**
 * Generates a location that is biased towards the center of the region.
 * This is achieved by using a `randomDistance` function with a higher shape parameter,
 * which makes smaller distances more likely.
 * @param region The geographic region.
 * @returns A location biased towards the center of the region.
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
 * Generates a location within a small, random cluster inside the region.
 * This can simulate more densely populated areas or specific points of interest.
 * @param region The geographic region.
 * @returns A location within a random cluster.
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
 * Generates a location that is intentionally scattered and avoids clustering.
 * This is useful for creating a wide variety of locations across the entire region.
 * @param region The geographic region.
 * @returns A scattered location.
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
 * Generates a random location within a specified geographic region.
 * It can use various distribution strategies to place the location and includes a retry
 * mechanism to ensure a valid coordinate is generated. If all attempts fail, it falls
 * back to the center of the region with a small random offset.
 *
 * @param region The region to generate a location in.
 * @param strategy The distribution strategy to use. Defaults to UNIFORM.
 * @param maxAttempts The maximum number of times to try generating a valid location.
 * @returns A random location within the region.
 */
function generateLocationInRegion(
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

  // Occasionally, a random strategy is chosen to increase unpredictability.
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

      // A small amount of jitter is added to the final coordinates to make the location less predictable.
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

  // If all attempts fail, fall back to the region's center with a small random offset.
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
 * Generates a random location from the entire set of available regions.
 * It uses a weighted random selection algorithm to efficiently pick a region based on its
 * weight (e.g., population or area), and then generates a location within that region.
 *
 * @param maxAttempts The maximum number of attempts to find a valid location.
 * @returns A random location.
 */
export function generateRandomLocation(maxAttempts: number = 25): Location {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // The `getRandomRegion` function uses a weighted selection algorithm (O(log n)), which is very efficient.
      const selectedRegion = getRandomRegion();

      // A random distribution strategy is chosen to ensure variety in location generation.
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

  // If generation fails, a fallback location is chosen from a predefined list to ensure the game can continue.
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
 * Generates a random location within a specific country.
 * This function is highly optimized, using a hash map for O(1) region lookups by country.
 * It also employs different generation strategies based on the size of the regions within the country.
 *
 * @param countryName The name of the country to generate a location in.
 * @param maxAttempts The maximum number of attempts.
 * @returns A random location within the specified country.
 */
export function generateLocationByCountry(countryName: string, maxAttempts: number = 25): Location {
  if (!countryName || typeof countryName !== 'string') {
    throw new Error('Invalid country name provided');
  }

  // `getRegionsByCountryOptimized` uses a hash map for fast lookups.
  const countryRegions = getRegionsByCountryOptimized(countryName);
  if (countryRegions.length === 0) {
    logger.error('No regions found for country, falling back to random', { countryName }, 'LocationGenerator');
    return generateRandomLocation(maxAttempts);
  }

  // The Fisher-Yates shuffle algorithm is used to randomize the order of regions.
  const shuffledRegions = [...countryRegions];
  for (let i = shuffledRegions.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i);
    [shuffledRegions[i], shuffledRegions[j]] = [shuffledRegions[j], shuffledRegions[i]];
  }

  const attemptsPerRegion = Math.max(1, Math.floor(maxAttempts / shuffledRegions.length));

  for (const region of shuffledRegions) {
    for (let attempt = 0; attempt < attemptsPerRegion; attempt++) {
      try {
        // The generation strategy is adapted based on the size of the region.
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

  // Fallback to the center of the first region if all else fails.
  logger.warn('Failed to generate valid location for country, using region center', { countryName }, 'LocationGenerator');
  const fallbackRegion = shuffledRegions[0];

  const offsetLat = (secureRandom() - 0.5) * 0.05;
  const offsetLng = (secureRandom() - 0.5) * 0.05;

  return {
    lat: fallbackRegion.lat + offsetLat,
    lng: fallbackRegion.lng + offsetLng
  };
}


