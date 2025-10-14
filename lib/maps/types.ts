import type { Location, StreetViewLocation } from '../types';

/**
 * Defines the options for creating a Google Map.
 */
export interface MapOptions {
  /** The initial zoom level of the map. */
  zoom?: number;
  /** The initial center of the map. */
  center?: Location;
  /** Whether to display the map type control. */
  mapTypeControl?: boolean;
  /** Whether to display the Street View pegman control. */
  streetViewControl?: boolean;
  /** Whether to display the fullscreen control. */
  fullscreenControl?: boolean;
  /** Whether to display the zoom control. */
  zoomControl?: boolean;
  /** The gesture handling strategy for the map. */
  gestureHandling?: string;
  /** An array of map styles to apply to the map. */
  styles?: google.maps.MapTypeStyle[];
  /** The ID of the map, used for Cloud-based Maps Styling. */
  mapId?: string;
}

/**
 * Defines the options for creating a Street View panorama.
 */
export interface StreetViewOptions {
  /** The position of the Street View panorama. */
  position: google.maps.LatLng;
  /** The point of view for the Street View panorama. */
  pov: {
    heading: number;
    pitch: number;
  };
  /** The zoom level of the Street View panorama. */
  zoom: number;
  /** Whether to display the address control. */
  addressControl: boolean;
  /** Whether to display the links control. */
  linksControl: boolean;
  /** Whether to display the pan control. */
  panControl: boolean;
  /** Whether to display the close button. */
  enableCloseButton: boolean;
  /** Whether to show road labels. */
  showRoadLabels: boolean;
  /** The gesture handling strategy for the Street View panorama. */
  gestureHandling: string,
  /** Whether to enable motion tracking. */
  motionTracking: boolean;
  /** Whether to display the motion tracking control. */
  motionTrackingControl: boolean;
}

export type { Location, StreetViewLocation };