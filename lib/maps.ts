import { Loader } from '@googlemaps/js-api-loader';
import { Location, StreetViewLocation } from './types';
import { logger } from './logger';
import { generateRandomLocation } from './locations';

class MapsManager {
  private loader: Loader | null = null;
  private isLoaded = false;
  private streetViewService: google.maps.StreetViewService | null = null;
  private mapId: string | null = null;

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
      this.streetViewService = new google.maps.StreetViewService();
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
   */
  async getRandomStreetViewLocation(): Promise<StreetViewLocation> {
    this.ensureLoaded();

    logger.startTimer('streetview-location-generation');
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        logger.startTimer(`streetview-check-${attempts}`);
        const randomLocation = generateRandomLocation();
        const streetViewData = await this.checkStreetViewAvailability(randomLocation);
        const checkDuration = logger.endTimer(`streetview-check-${attempts}`);

        if (streetViewData) {
          const totalDuration = logger.endTimer('streetview-location-generation', 'Found valid Street View location');
          logger.perf('Street View location generation', totalDuration, {
            attempts,
            avgCheckTime: checkDuration,
            location: randomLocation
          });

          return {
            location: {
              lat: streetViewData.location!.latLng!.lat(),
              lng: streetViewData.location!.latLng!.lng()
            },
            panoId: streetViewData.location!.pano,
            heading: Math.random() * 360,
            pitch: -10 + Math.random() * 20,
            zoom: 1
          };
        }
      } catch (error) {
        logger.endTimer(`streetview-check-${attempts}`);
        logger.warn('Street View check failed', { attempt: attempts, error }, 'MapsManager');
      }
    }

    logger.endTimer('streetview-location-generation');
    throw new Error('Could not find a valid Street View location after maximum attempts');
  }



  private async checkStreetViewAvailability(location: Location): Promise<google.maps.StreetViewPanoramaData | null> {
    return new Promise((resolve) => {
      if (!this.streetViewService) {
        resolve(null);
        return;
      }

      this.streetViewService.getPanorama({
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 50000, // 50km radius
        source: google.maps.StreetViewSource.OUTDOOR
      }, (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data) {
          resolve(data);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Create a Street View panorama
   */
  createStreetView(container: HTMLElement, location: StreetViewLocation): google.maps.StreetViewPanorama {
    this.ensureLoaded();

    logger.startTimer('streetview-creation');
    const panorama = new google.maps.StreetViewPanorama(container, {
      position: new google.maps.LatLng(location.location.lat, location.location.lng),
      pov: {
        heading: location.heading || 0,
        pitch: location.pitch || 0
      },
      zoom: location.zoom || 1,
      addressControl: false,
      linksControl: false,
      panControl: false,
      enableCloseButton: false,
      showRoadLabels: false,
      motionTracking: false,
      motionTrackingControl: false
    });

    const duration = logger.endTimer('streetview-creation', 'Street View panorama created');
    logger.perf('Street View creation', duration, { panoId: location.panoId });

    return panorama;
  }

  /**
   * Create a map for guessing
   */
  createMap(container: HTMLElement): google.maps.Map {
    this.ensureLoaded();

    logger.startTimer('guess-map-creation');
    const mapOptions: google.maps.MapOptions = {
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
      ]
    };

    // Add Map ID (required for Advanced Markers)
    mapOptions.mapId = this.mapId!;

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
    this.ensureLoaded();

    logger.startTimer('results-map-creation');
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(new google.maps.LatLng(actualLocation.lat, actualLocation.lng));
    bounds.extend(new google.maps.LatLng(guessedLocation.lat, guessedLocation.lng));

    const mapOptions: google.maps.MapOptions = {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy',
      mapId: this.mapId!
    };

    const map = new google.maps.Map(container, mapOptions);

    // Actual location marker (green) - Advanced Marker
    const actualMarkerElement = document.createElement('div');
    actualMarkerElement.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#22c55e"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    `;

    new google.maps.marker.AdvancedMarkerElement({
      position: new google.maps.LatLng(actualLocation.lat, actualLocation.lng),
      map,
      title: 'Actual Location',
      content: actualMarkerElement
    });

    // Guessed location marker (red) - Advanced Marker
    const guessedMarkerElement = document.createElement('div');
    guessedMarkerElement.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
        <circle cx="12" cy="9" r="2.5" fill="white"/>
      </svg>
    `;

    new google.maps.marker.AdvancedMarkerElement({
      position: new google.maps.LatLng(guessedLocation.lat, guessedLocation.lng),
      map,
      title: 'Your Guess',
      content: guessedMarkerElement
    });

    // Connection line
    new google.maps.Polyline({
      path: [
        new google.maps.LatLng(actualLocation.lat, actualLocation.lng),
        new google.maps.LatLng(guessedLocation.lat, guessedLocation.lng)
      ],
      geodesic: true,
      strokeColor: '#6366f1',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map
    });

    map.fitBounds(bounds);

    const duration = logger.endTimer('results-map-creation', 'Results map created');
    logger.perf('Results map creation', duration, {
      actualLocation,
      guessedLocation
    });

    return map;
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
}

export const mapsManager = new MapsManager();
