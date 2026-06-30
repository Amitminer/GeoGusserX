import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import type { Location, StreetViewLocation } from './types';
import { logger } from '../logger';
import { StreetViewService } from './street-view';
import { MapFactory } from './map-factory';
import { GeocodingService } from './geocoding';

/**
 * A singleton class that manages all interactions with the Google Maps API.
 * It handles the loading of the API, initialization of various map-related services,
 * and provides a centralized point of access to these services.
 */
export class MapsManager {
  private isLoaded = false;
  private mapId: string | null = null;
  private streetViewService: StreetViewService | null = null;
  private mapFactory: MapFactory | null = null;
  private geocodingService: GeocodingService | null = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    this.mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || null;

    if (!apiKey) {
      logger.error('Google Maps API key not found', undefined, 'MapsManager');
      return;
    }

    if (typeof window !== 'undefined') {
      if (!this.mapId) {
        logger.error('Google Maps Map ID not found. Map ID is required for Advanced Markers. Please set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID in your environment variables.', undefined, 'MapsManager');
        throw new Error('Google Maps Map ID is required. Please set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID in your environment variables.');
      }

      setOptions({
        key: apiKey,
        v: 'weekly',
        libraries: ['geometry', 'places', 'marker'],
        mapIds: [this.mapId]
      });
    }
  }

  /**
   * Asynchronously loads the Google Maps API and initializes all the necessary services.
   * This method should be called before any other methods of the `MapsManager` are used.
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isLoaded) return;

    logger.startTimer('maps-api-init');
    try {
      await importLibrary('maps');
      await importLibrary('geometry');
      await importLibrary('places');
      await importLibrary('marker');
      
      this.streetViewService = new StreetViewService();
      this.mapFactory = new MapFactory(this.mapId);
      this.geocodingService = new GeocodingService();
      this.geocodingService.initialize();
      this.isLoaded = true;
      
      const duration = logger.endTimer('maps-api-init', 'Google Maps API loaded successfully');
      logger.perf('Maps API initialization', duration, { libraries: ['maps', 'geometry', 'places', 'marker'] });
    } catch (error) {
      logger.endTimer('maps-api-init');
      logger.error('Failed to load Google Maps API', error, 'MapsManager');
      throw error;
    }
  }

  /**
   * A private helper method that ensures the Google Maps API has been loaded before
   * attempting to use any of the services.
   */
  private ensureLoaded(): void {
    if (!this.isLoaded) {
      throw new Error('Google Maps API not loaded. Call initialize() first.');
    }
  }

  /**
   * Generates a random location with available Street View.
   * @param countryName An optional country name to restrict the location generation.
   * @returns A promise that resolves with a `StreetViewLocation` object.
   */
  async getRandomStreetViewLocation(countryName?: string): Promise<StreetViewLocation> {
    this.ensureLoaded();
    if (!this.streetViewService) {
      throw new Error('Street View service not initialized');
    }
    return this.streetViewService.getRandomStreetViewLocation(countryName);
  }

  /**
   * Creates a Street View panorama.
   * @param container The HTML element to render the panorama in.
   * @param location The location to display.
   * @returns A `google.maps.StreetViewPanorama` instance.
   */
  createStreetView(container: HTMLElement, location: StreetViewLocation): google.maps.StreetViewPanorama {
    this.ensureLoaded();
    if (!this.streetViewService) {
      throw new Error('Street View service not initialized');
    }
    return this.streetViewService.createStreetView(container, location);
  }

  /**
   * Creates a map for the guessing screen.
   * @param container The HTML element to render the map in.
   * @returns A `google.maps.Map` instance.
   */
  createMap(container: HTMLElement): google.maps.Map {
    this.ensureLoaded();
    if (!this.mapFactory) {
      throw new Error('Map factory not initialized');
    }
    return this.mapFactory.createGuessMap(container);
  }

  /**
   * Creates a map to display the results of a round.
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
    this.ensureLoaded();
    if (!this.mapFactory) {
      throw new Error('Map factory not initialized');
    }
    return this.mapFactory.createResultsMap(container, actualLocation, guessedLocation);
  }

  /**
   * Checks if the Google Maps API has been loaded.
   * @returns `true` if the API is loaded, `false` otherwise.
   */
  isInitialized(): boolean {
    return this.isLoaded;
  }

  /**
   * Returns the Google Maps Map ID being used.
   */
  getMapId(): string | null {
    return this.mapId;
  }

  /**
   * Returns the `StreetViewService` instance.
   */
  getStreetViewService(): StreetViewService | null {
    return this.streetViewService;
  }

  /**
   * Returns the `MapFactory` instance.
   */
  getMapFactory(): MapFactory | null {
    return this.mapFactory;
  }

  /**
   * Returns the `GeocodingService` instance.
   */
  getGeocodingService(): GeocodingService | null {
    return this.geocodingService;
  }
}