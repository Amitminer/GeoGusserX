import type { Location, MapOptions } from './types';
import { logger } from '../logger';
import { MarkerService } from './markers';

/**
 * A factory class for creating different types of Google Maps used in the application.
 * This class encapsulates the logic for map creation and configuration, making it easy
 * to create consistent and correctly configured maps.
 */
export class MapFactory {
  private mapId: string | null;
  private markerService: MarkerService;

  constructor(mapId: string | null) {
    this.mapId = mapId;
    this.markerService = new MarkerService();
  }

  /**
   * Creates a map for the main guessing screen.
   * @param container The HTML element to render the map in.
   * @returns A `google.maps.Map` instance.
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
   * Creates a map to display the results of a round, showing both the actual and guessed locations.
   * It also creates markers for both locations and a line connecting them.
   *
   * @param container The HTML element to render the map in.
   * @param actualLocation The actual location.
   * @param guessedLocation The user's guessed location.
   * @returns A `google.maps.Map` instance.
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

    this.markerService.createActualLocationMarker(map, actualLocation);
    this.markerService.createGuessedLocationMarker(map, guessedLocation);
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
   * Creates a generic map with a given set of options.
   * @param container The HTML element to render the map in.
   * @param options An optional object of `MapOptions` to override the defaults.
   * @returns A `google.maps.Map` instance.
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