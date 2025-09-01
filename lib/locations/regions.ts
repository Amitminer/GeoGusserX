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
 * Predefined geographic regions with high Street View coverage
 * Organized by countries and their major states/regions
 */
export const GEOGRAPHIC_REGIONS: GeographicRegion[] = [
	// === NORTH AMERICA ===
	
	// United States - Whole Country
	{
		lat: 39.8283,
		lng: -98.5795,
		radius: 25,
		name: 'United States',
		continent: 'North America',
		type: 'country'
	},
	
	// United States - Major States
	{
		lat: 36.7783,
		lng: -119.4179,
		radius: 8,
		name: 'California, USA',
		continent: 'North America',
		type: 'state'
	},
	{
		lat: 31.9686,
		lng: -99.9018,
		radius: 10,
		name: 'Texas, USA',
		continent: 'North America',
		type: 'state'
	},
	{
		lat: 40.7589,
		lng: -73.9851,
		radius: 3,
		name: 'New York, USA',
		continent: 'North America',
		type: 'state'
	},
	{
		lat: 27.7663,
		lng: -82.6404,
		radius: 6,
		name: 'Florida, USA',
		continent: 'North America',
		type: 'state'
	},
	
	// Canada - Whole Country
	{
		lat: 56.1304,
		lng: -106.3468,
		radius: 20,
		name: 'Canada',
		continent: 'North America',
		type: 'country'
	},
	
	// Canada - Major Provinces
	{
		lat: 51.0447,
		lng: -114.0719,
		radius: 8,
		name: 'Alberta, Canada',
		continent: 'North America',
		type: 'state'
	},
	{
		lat: 49.2827,
		lng: -123.1207,
		radius: 6,
		name: 'British Columbia, Canada',
		continent: 'North America',
		type: 'state'
	},
	{
		lat: 45.5017,
		lng: -73.5673,
		radius: 6,
		name: 'Quebec, Canada',
		continent: 'North America',
		type: 'state'
	},
	
	// Mexico - Whole Country
	{
		lat: 23.6345,
		lng: -102.5528,
		radius: 15,
		name: 'Mexico',
		continent: 'North America',
		type: 'country'
	},
	
	// === EUROPE ===
	
	// United Kingdom - Whole Country
	{
		lat: 55.3781,
		lng: -3.4360,
		radius: 8,
		name: 'United Kingdom',
		continent: 'Europe',
		type: 'country'
	},
	
	// UK - Regions
	{
		lat: 51.5074,
		lng: -0.1278,
		radius: 3,
		name: 'England, UK',
		continent: 'Europe',
		type: 'region'
	},
	{
		lat: 56.4907,
		lng: -4.2026,
		radius: 4,
		name: 'Scotland, UK',
		continent: 'Europe',
		type: 'region'
	},
	
	// Germany - Whole Country
	{
		lat: 51.1657,
		lng: 10.4515,
		radius: 8,
		name: 'Germany',
		continent: 'Europe',
		type: 'country'
	},
	
	// France - Whole Country
	{
		lat: 46.2276,
		lng: 2.2137,
		radius: 8,
		name: 'France',
		continent: 'Europe',
		type: 'country'
	},
	
	// Spain - Whole Country
	{
		lat: 40.4637,
		lng: -3.7492,
		radius: 8,
		name: 'Spain',
		continent: 'Europe',
		type: 'country'
	},
	
	// Italy - Whole Country
	{
		lat: 41.8719,
		lng: 12.5674,
		radius: 8,
		name: 'Italy',
		continent: 'Europe',
		type: 'country'
	},
	
	// Netherlands - Whole Country
	{
		lat: 52.1326,
		lng: 5.2913,
		radius: 3,
		name: 'Netherlands',
		continent: 'Europe',
		type: 'country'
	},
	
	// Sweden - Whole Country
	{
		lat: 60.1282,
		lng: 18.6435,
		radius: 10,
		name: 'Sweden',
		continent: 'Europe',
		type: 'country'
	},
	
	// Norway - Whole Country
	{
		lat: 60.4720,
		lng: 8.4689,
		radius: 10,
		name: 'Norway',
		continent: 'Europe',
		type: 'country'
	},
	
	// Denmark - Whole Country
	{
		lat: 56.2639,
		lng: 9.5018,
		radius: 4,
		name: 'Denmark',
		continent: 'Europe',
		type: 'country'
	},
	
	// Belgium - Whole Country
	{
		lat: 50.5039,
		lng: 4.4699,
		radius: 2,
		name: 'Belgium',
		continent: 'Europe',
		type: 'country'
	},
	
	// Switzerland - Whole Country
	{
		lat: 46.8182,
		lng: 8.2275,
		radius: 3,
		name: 'Switzerland',
		continent: 'Europe',
		type: 'country'
	},
	
	// Austria - Whole Country
	{
		lat: 47.5162,
		lng: 14.5501,
		radius: 4,
		name: 'Austria',
		continent: 'Europe',
		type: 'country'
	},
	
	// Poland - Whole Country
	{
		lat: 52.2297,
		lng: 21.0122,
		radius: 8,
		name: 'Poland',
		continent: 'Europe',
		type: 'country'
	},
	
	// Czech Republic - Whole Country
	{
		lat: 49.8175,
		lng: 15.4730,
		radius: 4,
		name: 'Czech Republic',
		continent: 'Europe',
		type: 'country'
	},
	
	// Finland - Whole Country
	{
		lat: 61.9241,
		lng: 25.7482,
		radius: 8,
		name: 'Finland',
		continent: 'Europe',
		type: 'country'
	},
	
	// Portugal - Whole Country
	{
		lat: 38.7223,
		lng: -9.1393,
		radius: 4,
		name: 'Portugal',
		continent: 'Europe',
		type: 'country'
	},
	
	// Greece - Whole Country
	{
		lat: 39.0742,
		lng: 21.8243,
		radius: 6,
		name: 'Greece',
		continent: 'Europe',
		type: 'country'
	},
	
	// Romania - Whole Country
	{
		lat: 45.9432,
		lng: 24.9668,
		radius: 6,
		name: 'Romania',
		continent: 'Europe',
		type: 'country'
	},
	
	// === ASIA ===
	
	// Japan - Whole Country
	{
		lat: 36.2048,
		lng: 138.2529,
		radius: 10,
		name: 'Japan',
		continent: 'Asia',
		type: 'country'
	},
	
	// Japan - Major Regions
	{
		lat: 35.6762,
		lng: 139.6503,
		radius: 2,
		name: 'Tokyo Region, Japan',
		continent: 'Asia',
		type: 'region'
	},
	{
		lat: 34.6937,
		lng: 135.5023,
		radius: 2,
		name: 'Kansai Region, Japan',
		continent: 'Asia',
		type: 'region'
	},
	{
		lat: 43.0642,
		lng: 141.3469,
		radius: 3,
		name: 'Hokkaido, Japan',
		continent: 'Asia',
		type: 'region'
	},
	
	// China - Whole Country
	{
		lat: 35.8617,
		lng: 104.1954,
		radius: 25,
		name: 'China',
		continent: 'Asia',
		type: 'country'
	},
	
	// South Korea - Whole Country
	{
		lat: 37.0902,
		lng: 127.7669,
		radius: 6,
		name: 'South Korea',
		continent: 'Asia',
		type: 'country'
	},
	
	// India - Whole Country
	{
		lat: 20.5937,
		lng: 78.9629,
		radius: 20,
		name: 'India',
		continent: 'Asia',
		type: 'country'
	},
	
	// Thailand - Whole Country
	{
		lat: 13.7563,
		lng: 100.5018,
		radius: 10,
		name: 'Thailand',
		continent: 'Asia',
		type: 'country'
	},
	
	// Vietnam - Whole Country
	{
		lat: 14.0583,
		lng: 108.2772,
		radius: 10,
		name: 'Vietnam',
		continent: 'Asia',
		type: 'country'
	},
	
	// Malaysia - Whole Country
	{
		lat: 3.1390,
		lng: 101.6869,
		radius: 8,
		name: 'Malaysia',
		continent: 'Asia',
		type: 'country'
	},
	
	// Indonesia - Whole Country
	{
		lat: -0.7893,
		lng: 113.9213,
		radius: 15,
		name: 'Indonesia',
		continent: 'Asia',
		type: 'country'
	},
	
	// Philippines - Whole Country
	{
		lat: 14.5995,
		lng: 120.9842,
		radius: 10,
		name: 'Philippines',
		continent: 'Asia',
		type: 'country'
	},
	
	// Taiwan - Whole Country
	{
		lat: 23.6978,
		lng: 120.9605,
		radius: 3,
		name: 'Taiwan',
		continent: 'Asia',
		type: 'country'
	},
	
	// Singapore - Whole Country
	{
		lat: 1.3521,
		lng: 103.8198,
		radius: 1,
		name: 'Singapore',
		continent: 'Asia',
		type: 'country'
	},
	
	// Hong Kong - Special Region
	{
		lat: 22.3193,
		lng: 114.1694,
		radius: 1,
		name: 'Hong Kong',
		continent: 'Asia',
		type: 'region'
	},
	
	// Israel - Whole Country
	{
		lat: 31.0461,
		lng: 34.8516,
		radius: 3,
		name: 'Israel',
		continent: 'Asia',
		type: 'country'
	},
	
	// Turkey - Whole Country
	{
		lat: 38.9637,
		lng: 35.2433,
		radius: 10,
		name: 'Turkey',
		continent: 'Asia',
		type: 'country'
	},
	
	// === OCEANIA ===
	
	// Australia - Whole Country
	{
		lat: -25.2744,
		lng: 133.7751,
		radius: 20,
		name: 'Australia',
		continent: 'Oceania',
		type: 'country'
	},
	
	// Australia - Major States
	{
		lat: -33.8688,
		lng: 151.2093,
		radius: 4,
		name: 'New South Wales, Australia',
		continent: 'Oceania',
		type: 'state'
	},
	{
		lat: -37.8136,
		lng: 144.9631,
		radius: 4,
		name: 'Victoria, Australia',
		continent: 'Oceania',
		type: 'state'
	},
	{
		lat: -27.4698,
		lng: 153.0251,
		radius: 6,
		name: 'Queensland, Australia',
		continent: 'Oceania',
		type: 'state'
	},
	
	// New Zealand - Whole Country
	{
		lat: -40.9006,
		lng: 174.8860,
		radius: 6,
		name: 'New Zealand',
		continent: 'Oceania',
		type: 'country'
	},
	
	// === SOUTH AMERICA ===
	
	// Brazil - Whole Country
	{
		lat: -14.2350,
		lng: -51.9253,
		radius: 20,
		name: 'Brazil',
		continent: 'South America',
		type: 'country'
	},
	
	// Argentina - Whole Country
	{
		lat: -38.4161,
		lng: -63.6167,
		radius: 15,
		name: 'Argentina',
		continent: 'South America',
		type: 'country'
	},
	
	// Chile - Whole Country
	{
		lat: -35.6751,
		lng: -71.5430,
		radius: 12,
		name: 'Chile',
		continent: 'South America',
		type: 'country'
	},
	
	// Colombia - Whole Country
	{
		lat: 4.5709,
		lng: -74.2973,
		radius: 10,
		name: 'Colombia',
		continent: 'South America',
		type: 'country'
	},
	
	// Peru - Whole Country
	{
		lat: -9.1900,
		lng: -75.0152,
		radius: 10,
		name: 'Peru',
		continent: 'South America',
		type: 'country'
	},
	
	// Uruguay - Whole Country
	{
		lat: -32.5228,
		lng: -55.7658,
		radius: 4,
		name: 'Uruguay',
		continent: 'South America',
		type: 'country'
	},
	
	// Ecuador - Whole Country
	{
		lat: -1.8312,
		lng: -78.1834,
		radius: 6,
		name: 'Ecuador',
		continent: 'South America',
		type: 'country'
	},
	
	// === AFRICA ===
	
	// South Africa - Whole Country
	{
		lat: -30.5595,
		lng: 22.9375,
		radius: 10,
		name: 'South Africa',
		continent: 'Africa',
		type: 'country'
	},
	
	// Egypt - Whole Country
	{
		lat: 26.0000,
		lng: 30.0000,
		radius: 10,
		name: 'Egypt',
		continent: 'Africa',
		type: 'country'
	},
	
	// Morocco - Whole Country
	{
		lat: 31.7917,
		lng: -7.0926,
		radius: 8,
		name: 'Morocco',
		continent: 'Africa',
		type: 'country'
	},
	
	// Tunisia - Whole Country
	{
		lat: 33.8869,
		lng: 9.5375,
		radius: 4,
		name: 'Tunisia',
		continent: 'Africa',
		type: 'country'
	},
	
	// Kenya - Whole Country
	{
		lat: -0.0236,
		lng: 37.9062,
		radius: 8,
		name: 'Kenya',
		continent: 'Africa',
		type: 'country'
	},
	
	// Nigeria - Whole Country
	{
		lat: 9.0820,
		lng: 8.6753,
		radius: 10,
		name: 'Nigeria',
		continent: 'Africa',
		type: 'country'
	}
];

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