import type { Location, StreetViewLocation } from '../types';

export interface MapOptions {
  zoom?: number;
  center?: Location;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
  zoomControl?: boolean;
  gestureHandling?: string;
  styles?: google.maps.MapTypeStyle[];
  mapId?: string;
}

export interface StreetViewOptions {
  position: google.maps.LatLng;
  pov: {
    heading: number;
    pitch: number;
  };
  zoom: number;
  addressControl: boolean;
  linksControl: boolean;
  panControl: boolean;
  enableCloseButton: boolean;
  showRoadLabels: boolean;
  motionTracking: boolean;
  motionTrackingControl: boolean;
}

export type { Location, StreetViewLocation };