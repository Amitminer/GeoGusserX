import { Loader } from '@googlemaps/js-api-loader';
import { Location, StreetViewLocation } from './types';
import { logger } from './logger';

class MapsManager {
  private loader: Loader | null = null;
  private isLoaded = false;
  private streetViewService: google.maps.StreetViewService | null = null;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      logger.error('Google Maps API key not found', undefined, 'MapsManager');
      return;
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
        const randomLocation = this.generateRandomLocation();
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

  private generateRandomLocation(): Location {
    // Focus on populated areas with higher Street View coverage
    const regions = [
      // North America
      { lat: 39.8283, lng: -98.5795, radius: 20 }, // USA
      { lat: 56.1304, lng: -106.3468, radius: 15 }, // Canada
      
      // Europe
      { lat: 54.5260, lng: 15.2551, radius: 15 }, // Europe
      { lat: 51.1657, lng: 10.4515, radius: 8 }, // Germany
      { lat: 46.2276, lng: 2.2137, radius: 8 }, // France
      { lat: 55.3781, lng: -3.4360, radius: 6 }, // UK
      
      // Asia
      { lat: 35.8617, lng: 104.1954, radius: 20 }, // China
      { lat: 36.2048, lng: 138.2529, radius: 8 }, // Japan
      { lat: 20.5937, lng: 78.9629, radius: 15 }, // India
      
      // Oceania
      { lat: -25.2744, lng: 133.7751, radius: 12 }, // Australia
      { lat: -40.9006, lng: 174.8860, radius: 4 }, // New Zealand
      
      // South America
      { lat: -14.2350, lng: -51.9253, radius: 15 }, // Brazil
      { lat: -38.4161, lng: -63.6167, radius: 8 }, // Argentina
    ];

    const region = regions[Math.floor(Math.random() * regions.length)];
    
    // Generate random point within the region
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * region.radius;
    
    const lat = region.lat + (distance * Math.cos(angle)) / 111; // Rough conversion
    const lng = region.lng + (distance * Math.sin(angle)) / (111 * Math.cos(region.lat * Math.PI / 180));
    
    return { lat, lng };
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
    const map = new google.maps.Map(container, {
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
    });
    
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

    const map = new google.maps.Map(container, {
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy'
    });

    // Actual location marker (green)
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

    // Guessed location marker (red)
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
}

export const mapsManager = new MapsManager();