import type { Location, MapOptions } from './types';
import { logger } from '../logger';
import { MarkerService } from './markers';

export class MapFactory {
  private mapId: string | null;
  private markerService: MarkerService;

  constructor(mapId: string | null) {
    this.mapId = mapId;
    this.markerService = new MarkerService();
  }

  /**
   * Create a map for guessing
   */
  createGuessMap(container: HTMLElement): google.maps.Map {
    logger.startTimer('guess-map-creation');
    
    const mapOptions: MapOptions = {
      zoom: 2,
      center: { lat: 20, lng: 0 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapId: this.mapId!
    };

    const map = new google.maps.Map(container, mapOptions);

    const duration = logger.endTimer('guess-map-creation', 'Guess map created');
    logger.perf('Guess map creation', duration);

    return map;
  }

  /**
   * Create a results map showing both locations
   */
  createResultsMap(
    container: HTMLElement,
    actualLocation: Location,
    guessedLocation: Location
  ): google.maps.Map {
    logger.startTimer('results-map-creation');
    
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(actualLocation.lat, actualLocation.lng));
    bounds.extend(new google.maps.LatLng(guessedLocation.lat, guessedLocation.lng));

    const mapOptions: MapOptions = {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy',
      mapId: this.mapId!
    };

    const map = new google.maps.Map(container, mapOptions);

    // Create markers
    this.markerService.createActualLocationMarker(map, actualLocation);
    this.markerService.createGuessedLocationMarker(map, guessedLocation);

    // Create connection line
    this.markerService.createConnectionLine(map, actualLocation, guessedLocation);

    map.fitBounds(bounds);

    const duration = logger.endTimer('results-map-creation', 'Results map created');
    logger.perf('Results map creation', duration, {
      actualLocation,
      guessedLocation
    });

    return map;
  }

  /**
   * Create a basic map with custom options
   */
  createMap(container: HTMLElement, options: Partial<MapOptions> = {}): google.maps.Map {
    const defaultOptions: MapOptions = {
      zoom: 2,
      center: { lat: 0, lng: 0 },
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'auto',
      mapId: this.mapId!
    };

    const mapOptions = { ...defaultOptions, ...options };
    return new google.maps.Map(container, mapOptions);
  }
}