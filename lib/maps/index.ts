// Main exports
export { MapsManager } from './maps-manager';
export { StreetViewService } from './street-view';
export { MapFactory } from './map-factory';
export { MarkerService } from './markers';

// Types
export * from './types';

// Create and export the singleton instance
import { MapsManager } from './maps-manager';
export const mapsManager = new MapsManager();