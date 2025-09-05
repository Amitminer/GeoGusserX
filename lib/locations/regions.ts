import Fuse from 'fuse.js';
import regionsData from './regions.json';
import { secureRandom } from './crypto';
import { logger } from '../logger';

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
 * Optimized Region Manager using modern algorithm libraries
 * Provides O(1) lookups and O(log n) weighted selection for 100k+ users
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

	constructor(regions: GeographicRegion[]) {
		this.buildOptimizedStructures(regions);
		this.setupFuzzySearch(regions);
	}

	/**
	 * Build all optimized data structures in one pass - O(n)
	 */
	private buildOptimizedStructures(regions: GeographicRegion[]): void {
		// Clear existing structures
		this.countryIndex.clear();
		this.typeIndex.clear();
		this.continentIndex.clear();
		this.weightedRegions = [];
		this.weights = [];
		this.cumulativeWeights = [];
		this.totalWeight = 0;

		let cumulativeWeight = 0;

		for (const region of regions) {
			// Build country index for O(1) exact lookups
			const countryKey = region.name.toLowerCase();
			if (!this.countryIndex.has(countryKey)) {
				this.countryIndex.set(countryKey, []);
			}
			this.countryIndex.get(countryKey)!.push(region);

			// Build type index
			if (!this.typeIndex.has(region.type)) {
				this.typeIndex.set(region.type, []);
			}
			this.typeIndex.get(region.type)!.push(region);

			// Build continent index
			if (!this.continentIndex.has(region.continent)) {
				this.continentIndex.set(region.continent, []);
			}
			this.continentIndex.get(region.continent)!.push(region);

			// Build weighted selection structures for O(log n) selection
			const weight = Math.log(region.radius + 1) + 1; // Size-based weight
			cumulativeWeight += weight;

			this.weightedRegions.push(region);
			this.weights.push(weight);
			this.cumulativeWeights.push(cumulativeWeight);
		}

		this.totalWeight = cumulativeWeight;
	}

	/**
	 * Setup Fuse.js for fuzzy country search
	 */
	private setupFuzzySearch(regions: GeographicRegion[]): void {
		const fuseOptions = {
			keys: ['name'],
			threshold: 0.3, // Fuzzy matching threshold
			includeScore: true,
			minMatchCharLength: 2,
		};

		this.fuse = new Fuse(regions, fuseOptions);
	}

	/**
	 * O(1) exact country lookup using hash map
	 */
	getRegionsByCountryExact(countryName: string): GeographicRegion[] {
		const key = countryName.toLowerCase();
		return this.countryIndex.get(key) || [];
	}

	/**
	 * Fuzzy country search using Fuse.js - handles typos and partial matches
	 */
	getRegionsByCountryFuzzy(countryName: string, maxResults: number = 10): GeographicRegion[] {
		const results = this.fuse.search(countryName, { limit: maxResults });
		return results.map(result => result.item);
	}

	/**
	 * Smart country lookup - tries exact first, then fuzzy
	 */
	getRegionsByCountryOptimized(countryName: string): GeographicRegion[] {
		// Try exact match first (O(1))
		const exactMatch = this.getRegionsByCountryExact(countryName);
		if (exactMatch.length > 0) {
			return exactMatch;
		}

		// Fallback to fuzzy search
		return this.getRegionsByCountryFuzzy(countryName);
	}

	/**
	 * O(1) type lookup using hash map
	 */
	getRegionsByTypeOptimized(type: 'country' | 'state' | 'region'): GeographicRegion[] {
		return this.typeIndex.get(type) || [];
	}

	/**
	 * O(1) continent lookup using hash map
	 */
	getRegionsByContinent(continent: string): GeographicRegion[] {
		return this.continentIndex.get(continent) || [];
	}

	/**
	 * O(log n) weighted random selection using binary search
	 * Much faster than linear scan for large datasets
	 */
	getRandomRegionWeighted(): GeographicRegion {
		const randomValue = secureRandom() * this.totalWeight;

		// Binary search for O(log n) selection
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
	 * Optimized weighted sampling using our own implementation
	 * Falls back to binary search if needed
	 */
	getRandomRegionWithLibrary(): GeographicRegion {
		// Use our optimized binary search method
		return this.getRandomRegionWeighted();
	}

	/**
	 * Get multiple random regions efficiently
	 */
	getMultipleRandomRegions(count: number): GeographicRegion[] {
		// Use multiple single selections with our optimized method
		const results: GeographicRegion[] = [];
		for (let i = 0; i < count; i++) {
			results.push(this.getRandomRegionWeighted());
		}
		return results;
	}

	/**
	 * Get performance statistics
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
	 * Benchmark different selection methods
	 */
	benchmark(iterations: number = 10000) {
		logger.info(`🚀 Benchmarking ${iterations} iterations...`, { iterations }, 'RegionManagerBenchmark');

		// Benchmark binary search method
		logger.startTimer('binary-search-benchmark');
		const start1 = performance.now();
		for (let i = 0; i < iterations; i++) {
			this.getRandomRegionWeighted();
		}
		const time1 = performance.now() - start1;
		logger.endTimer('binary-search-benchmark');

		// Benchmark optimized method
		logger.startTimer('optimized-method-benchmark');
		const start2 = performance.now();
		for (let i = 0; i < iterations; i++) {
			this.getRandomRegionWithLibrary();
		}
		const time2 = performance.now() - start2;
		logger.endTimer('optimized-method-benchmark');

		const binarySearchOpsPerSec = Math.round(iterations / time1 * 1000);
		const optimizedOpsPerSec = Math.round(iterations / time2 * 1000);
		const speedup = time1 / time2;

		logger.info('Region Manager Benchmark Results', {
			iterations,
			binarySearch: {
				timeMs: time1,
				opsPerSec: binarySearchOpsPerSec
			},
			optimizedMethod: {
				timeMs: time2,
				opsPerSec: optimizedOpsPerSec
			},
			speedup: speedup.toFixed(2) + 'x'
		}, 'RegionManagerBenchmark');
	}
}

// Create region manager instance
export const regionManager = new RegionManager(GEOGRAPHIC_REGIONS);

/**
 * Get all available countries (regions) sorted alphabetically
 */
export function getAvailableCountries(): string[] {
	return [...new Set(GEOGRAPHIC_REGIONS.map(region => region.name))].sort();
}

/**
 * Get regions by country name (case-insensitive)
 * Uses optimized hash map lookup for better performance
 */
export function getRegionsByCountry(countryName: string): GeographicRegion[] {
	return regionManager.getRegionsByCountryOptimized(countryName);
}

/**
 * Get regions by type (country, state, region)
 * Uses optimized hash map lookup
 */
export function getRegionsByType(type: 'country' | 'state' | 'region'): GeographicRegion[] {
	return regionManager.getRegionsByTypeOptimized(type);
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

// Export optimized functions for internal use
export function getRegionsByCountryOptimized(countryName: string): GeographicRegion[] {
	return regionManager.getRegionsByCountryOptimized(countryName);
}

export function getRandomRegionOptimized(): GeographicRegion {
	return regionManager.getRandomRegionWithLibrary();
}

export function getRegionsByTypeOptimized(type: 'country' | 'state' | 'region'): GeographicRegion[] {
	return regionManager.getRegionsByTypeOptimized(type);
}

export function getRegionsByContinent(continent: string): GeographicRegion[] {
	return regionManager.getRegionsByContinent(continent);
}

// Export the manager for advanced usage
export const optimizedRegionManager = regionManager;