// Main exports
export { MapsManager } from './maps-manager';
export { StreetViewService } from './street-view';
export { MapFactory } from './map-factory';
export { MarkerService } from './markers';
export { GeocodingService } from './geocoding';

// Types
export * from './types';

// Create and export the singleton instance
import { MapsManager } from './maps-manager';

/**
 * The singleton instance of the `MapsManager` class.
 * This ensures that there is only one instance of the `MapsManager` throughout the application,
 * which is important for managing the Google Maps API and its services.
 */
export const mapsManager = new MapsManager();
