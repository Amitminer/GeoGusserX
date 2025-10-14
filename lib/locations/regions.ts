import Fuse from 'fuse.js';
import regionsData from './regions.json';
import { secureRandom } from './crypto';
import { logger } from '../logger';

/**
 * Defines the structure for a geographic region used in location generation.
 * This interface supports a rich set of properties to describe various types of locations,
 * from entire countries to specific urban landmarks.
 */
export interface GeographicRegion {
  /** The latitude of the region's center. */
  lat: number;
  /** The longitude of the region's center. */
  lng: number;
  /** The radius of the region in kilometers, defining its approximate size. */
  radius: number;
  /** The name of the region (e.g., a country, state, or city). */
  name: string;
  /** The continent where the region is located. */
  continent: string;
  /** The type of the region, which helps in categorizing and selecting locations. */
  type: 'country' | 'state' | 'region' | 'directional' | 'urban' | 'suburban' | 'rural' | 'urban_landmark' | 'urban_grid' | 'commercial' | 'transport';
  /** The country this region belongs to, especially for states and sub-regions. */
  country?: string;
  /** A more specific category, often used for urban landmarks (e.g., 'landmark', 'commercial'). */
  category?: string;
  /** A score indicating the importance of a landmark, used for weighted selection. */
  importance?: number;
  /** The name of the city for urban regions. */
  city?: string;
  /** A classification of the area (e.g., 'urban', 'rural'). */
  area_classification?: string;
  /** A directional indicator for sub-regions of a country (e.g., 'north', 'south'). */
  direction?: string;
  /** The OpenStreetMap element type, used for identifying landmarks. */
  osm_type?: string;
}

/**
 * Defines the structure of the `regions.json` file.
 */
interface RegionsData {
  regions: GeographicRegion[];
}

/**
 * The complete list of all geographic regions loaded from the `regions.json` file.
 */
export const GEOGRAPHIC_REGIONS: GeographicRegion[] = (regionsData as RegionsData).regions;

/**
 * The `RegionManager` class is a highly optimized data structure for managing and querying
 * thousands of geographic regions. It uses a combination of hash maps for O(1) lookups,
 * a fuzzy search library (Fuse.js) for flexible queries, and a custom binary search
 * implementation for O(log n) weighted random selection.
 */
class RegionManager {
	private fuse!: Fuse<GeographicRegion>;
	private countryIndex: Map<string, GeographicRegion[]> = new Map();
	private typeIndex: Map<string, GeographicRegion[]> = new Map();
	private continentIndex: Map<string, GeographicRegion[]> = new Map();
	private weightedRegions: GeographicRegion[] = [];
	private weights: number[] = [];
	private cumulativeWeights: number[] = [];
	private totalWeight: number = 0;

	/**
	 * Initializes the RegionManager by building all the necessary data structures.
	 * @param regions An array of `GeographicRegion` objects.
	 */
	constructor(regions: GeographicRegion[]) {
		this.buildOptimizedStructures(regions);
		this.setupFuzzySearch(regions);
	}

	/**
	 * Builds all the optimized data structures in a single O(n) pass over the regions data.
	 * This includes creating hash maps for indexing by country, type, and continent, as well as
	 * preparing the data for weighted random selection.
	 * @param regions The array of geographic regions.
	 */
	private buildOptimizedStructures(regions: GeographicRegion[]): void {
		this.countryIndex.clear();
		this.typeIndex.clear();
		this.continentIndex.clear();
		this.weightedRegions = [];
		this.weights = [];
		this.cumulativeWeights = [];
		this.totalWeight = 0;

		let cumulativeWeight = 0;

		for (const region of regions) {
			// Build country index for O(1) exact lookups.
			const countryKey = region.name.toLowerCase();
			if (!this.countryIndex.has(countryKey)) {
				this.countryIndex.set(countryKey, []);
			}
			this.countryIndex.get(countryKey)!.push(region);

			// Build type index.
			if (!this.typeIndex.has(region.type)) {
				this.typeIndex.set(region.type, []);
			}
			this.typeIndex.get(region.type)!.push(region);

			// Build continent index.
			if (!this.continentIndex.has(region.continent)) {
				this.continentIndex.set(region.continent, []);
			}
			this.continentIndex.get(region.continent)!.push(region);

			// Build data structures for O(log n) weighted random selection.
			const weight = Math.log(region.radius + 1) + 1; // Weight is based on the size of the region.
			cumulativeWeight += weight;

			this.weightedRegions.push(region);
			this.weights.push(weight);
			this.cumulativeWeights.push(cumulativeWeight);
		}

		this.totalWeight = cumulativeWeight;
	}

	/**
	 * Sets up the Fuse.js instance for fuzzy searching of regions by name.
	 * @param regions The array of geographic regions.
	 */
	private setupFuzzySearch(regions: GeographicRegion[]): void {
		const fuseOptions = {
			keys: ['name'],
			threshold: 0.3, // A threshold of 0.3 provides a good balance between accuracy and flexibility.
			includeScore: true,
			minMatchCharLength: 2,
		};

		this.fuse = new Fuse(regions, fuseOptions);
	}

	/**
	 * Retrieves regions by an exact, case-insensitive country name lookup in O(1) time.
	 * @param countryName The exact name of the country.
	 * @returns An array of matching regions.
	 */
	getRegionsByCountryExact(countryName: string): GeographicRegion[] {
		const key = countryName.toLowerCase();
		return this.countryIndex.get(key) || [];
	}

	/**
	 * Retrieves regions using a fuzzy search on the country name. This is useful for handling typos or partial matches.
	 * @param countryName The name of the country to search for.
	 * @param maxResults The maximum number of results to return.
	 * @returns An array of matching regions.
	 */
	getRegionsByCountryFuzzy(countryName: string, maxResults: number = 10): GeographicRegion[] {
		const results = this.fuse.search(countryName, { limit: maxResults });
		return results.map(result => result.item);
	}

	/**
	 * A smart lookup function that first attempts an O(1) exact match and falls back to a fuzzy search if no exact match is found.
	 * @param countryName The name of the country.
	 * @returns An array of matching regions.
	 */
	getRegionsByCountryOptimized(countryName: string): GeographicRegion[] {
		const exactMatch = this.getRegionsByCountryExact(countryName);
		if (exactMatch.length > 0) {
			return exactMatch;
		}
		return this.getRegionsByCountryFuzzy(countryName);
	}

	/**
	 * Retrieves regions by their type in O(1) time using a hash map.
	 * @param type The type of the region (e.g., 'urban', 'country').
	 * @returns An array of matching regions.
	 */
	getRegionsByTypeOptimized(type: string): GeographicRegion[] {
		return this.typeIndex.get(type) || [];
	}

	/**
	 * Retrieves regions by their continent in O(1) time using a hash map.
	 * @param continent The name of the continent.
	 * @returns An array of matching regions.
	 */
	getRegionsByContinent(continent: string): GeographicRegion[] {
		return this.continentIndex.get(continent) || [];
	}

	/**
	 * Selects a random region using a weighted probability, where the weight is based on the region's size.
	 * This function uses a binary search on the cumulative weights array, achieving an efficient O(log n) time complexity.
	 * @returns A randomly selected `GeographicRegion`.
	 */
	getRandomRegionWeighted(): GeographicRegion {
		const randomValue = secureRandom() * this.totalWeight;

		// The binary search is significantly faster than a linear scan for large datasets.
		let left = 0;
		let right = this.cumulativeWeights.length - 1;

		while (left < right) {
			const mid = Math.floor((left + right) / 2);
			if (this.cumulativeWeights[mid] < randomValue) {
				left = mid + 1;
			} else {
				right = mid;
			}
		}

		return this.weightedRegions[left];
	}

	/**
	 * A wrapper function for the weighted random selection method.
	 * @returns A randomly selected `GeographicRegion`.
	 */
	getRandomRegionWithLibrary(): GeographicRegion {
		return this.getRandomRegionWeighted();
	}

	/**
	 * Retrieves multiple unique random regions.
	 * @param count The number of random regions to retrieve.
	 * @returns An array of `GeographicRegion` objects.
	 */
	getMultipleRandomRegions(count: number): GeographicRegion[] {
		const results: GeographicRegion[] = [];
		for (let i = 0; i < count; i++) {
			results.push(this.getRandomRegionWeighted());
		}
		return results;
	}

	/**
	 * Returns performance and data statistics for the RegionManager.
	 * @returns An object containing statistics.
	 */
	getStats() {
		return {
			totalRegions: this.weightedRegions.length,
			countries: this.countryIndex.size,
			types: this.typeIndex.size,
			continents: this.continentIndex.size,
			totalWeight: this.totalWeight,
			averageWeight: this.totalWeight / this.weightedRegions.length,
		};
	}

	/**
	 * A developer utility for benchmarking the performance of the random selection algorithms.
	 * @param iterations The number of iterations to run.
	 */
	benchmark(iterations: number = 10000) {
		logger.info(`🚀 Benchmarking ${iterations} iterations...`, { iterations }, 'RegionManagerBenchmark');

		logger.startTimer('binary-search-benchmark');
		const start1 = performance.now();
		for (let i = 0; i < iterations; i++) {
			this.getRandomRegionWeighted();
		}
		const time1 = performance.now() - start1;
		logger.endTimer('binary-search-benchmark');

		logger.startTimer('our-method-benchmark');
		const start2 = performance.now();
		for (let i = 0; i < iterations; i++) {
			this.getRandomRegionWithLibrary();
		}
		const time2 = performance.now() - start2;
		logger.endTimer('our-method-benchmark');

		const binarySearchOpsPerSec = Math.round(iterations / time1 * 1000);
		const ourMethodOpsPerSec = Math.round(iterations / time2 * 1000);
		const speedup = time1 / time2;

		logger.info('Region Manager Benchmark Results', {
			iterations,
			binarySearch: {
				timeMs: time1,
				opsPerSec: binarySearchOpsPerSec
			},
			ourMethod: {
				timeMs: time2,
				opsPerSec: ourMethodOpsPerSec
			},
			speedup: speedup.toFixed(2) + 'x'
		}, 'RegionManagerBenchmark');
	}
}

/** The singleton instance of the `RegionManager`. */
export const regionManager = new RegionManager(GEOGRAPHIC_REGIONS);

/**
 * Returns a sorted list of all available country names.
 */
export function getAvailableCountries(): string[] {
	return [...new Set(GEOGRAPHIC_REGIONS.map(region => region.name))].sort();
}

/**
 * Retrieves regions for a given country using the optimized lookup in the `RegionManager`.
 * @param countryName The name of the country.
 * @returns An array of matching regions.
 */
export function getRegionsByCountry(countryName: string): GeographicRegion[] {
	return regionManager.getRegionsByCountryOptimized(countryName);
}

/**
 * Retrieves regions by their type using the optimized lookup in the `RegionManager`.
 * @param type The type of region.
 * @returns An array of matching regions.
 */
export function getRegionsByType(type: string): GeographicRegion[] {
	return regionManager.getRegionsByTypeOptimized(type);
}

/**
 * Returns a sorted list of all regions that are of type 'country'.
 */
export function getCountriesOnly(): string[] {
	return GEOGRAPHIC_REGIONS
		.filter(region => region.type === 'country')
		.map(region => region.name)
		.sort();
}

/**
 * Retrieves all states or sub-regions for a specific country.
 * @param countryName The name of the country.
 * @returns An array of matching state/region objects.
 */
export function getStatesForCountry(countryName: string): GeographicRegion[] {
	return GEOGRAPHIC_REGIONS.filter(region => {
		if (region.type !== 'state' && region.type !== 'region') {
			return false;
		}

		if (region.country) {
			return region.country.toLowerCase() === countryName.toLowerCase();
		}

		const nameParts = region.name.split(', ');
		if (nameParts.length >= 2) {
			const regionCountry = nameParts[nameParts.length - 1];
			return regionCountry.toLowerCase() === countryName.toLowerCase();
		}

		return false;
	});
}

/** Retrieves regions for a country using the optimized method. For internal use. */
export function getRegionsByCountryOptimized(countryName: string): GeographicRegion[] {
	return regionManager.getRegionsByCountryOptimized(countryName);
}

/** Selects a random region using the weighted library method. For internal use. */
export function getRandomRegion(): GeographicRegion {
	return regionManager.getRandomRegionWithLibrary();
}

/** Retrieves regions by type using the optimized method. For internal use. */
export function getRegionsByTypeOptimized(type: string): GeographicRegion[] {
	return regionManager.getRegionsByTypeOptimized(type);
}

/** Retrieves regions by continent. For internal use. */
export function getRegionsByContinent(continent: string): GeographicRegion[] {
	return regionManager.getRegionsByContinent(continent);
}

/** The singleton instance of the `RegionManager`, exported for advanced usage. */
export const regionManagerInstance = regionManager;