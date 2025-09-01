/**
 * Geographic region definition for location generation
 */
export interface GeographicRegion {
	lat: number;
	lng: number;
	radius: number;
	name: string;
	continent: string;
}

/**
 * Predefined geographic regions with high Street View coverage
 * Focus on populated areas with good Street View availability
 */
export const GEOGRAPHIC_REGIONS: GeographicRegion[] = [
	// North America
	{
		lat: 39.8283,
		lng: -98.5795,
		radius: 20,
		name: 'United States',
		continent: 'North America'
	},
	{
		lat: 56.1304,
		lng: -106.3468,
		radius: 15,
		name: 'Canada',
		continent: 'North America'
	},

	// Europe
	{
		lat: 54.5260,
		lng: 15.2551,
		radius: 15,
		name: 'Central Europe',
		continent: 'Europe'
	},
	{
		lat: 51.1657,
		lng: 10.4515,
		radius: 8,
		name: 'Germany',
		continent: 'Europe'
	},
	{
		lat: 46.2276,
		lng: 2.2137,
		radius: 8,
		name: 'France',
		continent: 'Europe'
	},
	{
		lat: 55.3781,
		lng: -3.4360,
		radius: 6,
		name: 'United Kingdom',
		continent: 'Europe'
	},

	// Asia
	{
		lat: 35.8617,
		lng: 104.1954,
		radius: 20,
		name: 'China',
		continent: 'Asia'
	},
	{
		lat: 35.6895,
		lng: 139.6917,
		radius: 1,
		name: 'Tokyo, Japan',
		continent: 'Asia'
	},
	{
		lat: 34.6937,
		lng: 135.5023,
		radius: 1,
		name: 'Osaka, Japan',
		continent: 'Asia'
	},
	{
		lat: 34.3963,
		lng: 132.4596,
		radius: 1,
		name: 'Hiroshima, Japan',
		continent: 'Asia'
	},
	{
		lat: 35.0116,
		lng: 135.7681,
		radius: 1,
		name: 'Kyoto, Japan',
		continent: 'Asia'
	},
	{
		lat: 36.2048,
		lng: 138.2529,
		radius: 8,
		name: 'Japan',
		continent: 'Asia'
	},
	{
		lat: 20.5937,
		lng: 78.9629,
		radius: 15,
		name: 'India',
		continent: 'Asia'
	},

	// Oceania
	{
		lat: -25.2744,
		lng: 133.7751,
		radius: 12,
		name: 'Australia',
		continent: 'Oceania'
	},
	{
		lat: -40.9006,
		lng: 174.8860,
		radius: 4,
		name: 'New Zealand',
		continent: 'Oceania'
	},

	// South America
	{
		lat: -14.2350,
		lng: -51.9253,
		radius: 15,
		name: 'Brazil',
		continent: 'South America'
	},
	{
		lat: -38.4161,
		lng: -63.6167,
		radius: 8,
		name: 'Argentina',
		continent: 'South America'
	}
];
