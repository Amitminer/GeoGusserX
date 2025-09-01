import { Loader } from '@googlemaps/js-api-loader';
import type { Location, StreetViewLocation } from './types';
import { logger } from '../logger';
import { StreetViewService } from './street-view';
import { MapFactory } from './map-factory';
import { GeocodingService } from './geocoding';

export class MapsManager {
  private loader: Loader | null = null;
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

    if (!this.mapId) {
      logger.error('Google Maps Map ID not found. Map ID is required for Advanced Markers. Please set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID in your environment variables.', undefined, 'MapsManager');
      throw new Error('Google Maps Map ID is required. Please set NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID in your environment variables.');
    }

    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['geometry', 'places', 'marker']
    });
  }

  async initialize(): Promise<void> {
    if (this.isLoaded || !this.loader) return;

    logger.startTimer('maps-api-init');
    try {
      await this.loader.importLibrary('maps');
      await this.loader.importLibrary('geometry');
      await this.loader.importLibrary('places');
      await this.loader.importLibrary('marker');
      
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

  private ensureLoaded(): void {
    if (!this.isLoaded) {
      throw new Error('Google Maps API not loaded. Call initialize() first.');
    }
  }

  /**
   * Generate a random location with available Street View
   * @param countryName - Optional country name to restrict location generation
   */
  async getRandomStreetViewLocation(countryName?: string): Promise<StreetViewLocation> {
    this.ensureLoaded();
    if (!this.streetViewService) {
      throw new Error('Street View service not initialized');
    }
    return this.streetViewService.getRandomStreetViewLocation(countryName);
  }

  /**
   * Create a Street View panorama
   */
  createStreetView(container: HTMLElement, location: StreetViewLocation): google.maps.StreetViewPanorama {
    this.ensureLoaded();
    if (!this.streetViewService) {
      throw new Error('Street View service not initialized');
    }
    return this.streetViewService.createStreetView(container, location);
  }

  /**
   * Create a map for guessing
   */
  createMap(container: HTMLElement): google.maps.Map {
    this.ensureLoaded();
    if (!this.mapFactory) {
      throw new Error('Map factory not initialized');
    }
    return this.mapFactory.createGuessMap(container);
  }

  /**
   * Create a results map showing both locations
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

  isInitialized(): boolean {
    return this.isLoaded;
  }

  /**
   * Get the Map ID being used
   */
  getMapId(): string | null {
    return this.mapId;
  }

  /**
   * Get the street view service instance
   */
  getStreetViewService(): StreetViewService | null {
    return this.streetViewService;
  }

  /**
   * Get the map factory instance
   */
  getMapFactory(): MapFactory | null {
    return this.mapFactory;
  }

  /**
   * Get the geocoding service instance
   */
  getGeocodingService(): GeocodingService | null {
    return this.geocodingService;
  }
}