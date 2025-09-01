import { logger } from '../logger';
import type { Location } from './types';

export interface GeocodeResult {
  country: string;
  countryCode: string;
  formattedAddress: string;
}

export class GeocodingService {
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    if (typeof google !== 'undefined' && google.maps) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Initialize the geocoding service
   */
  initialize(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Get country information from coordinates using reverse geocoding
   */
  async getCountryFromCoordinates(location: Location): Promise<GeocodeResult | null> {
    if (!this.geocoder) {
      logger.error('Geocoder not initialized', undefined, 'GeocodingService');
      return null;
    }

    logger.startTimer('reverse-geocode');
    
    try {
      const response = await this.geocoder.geocode({
        location: { lat: location.lat, lng: location.lng }
      });

      if (response.results && response.results.length > 0) {
        // Find the country component
        for (const result of response.results) {
          const countryComponent = result.address_components?.find(
            component => component.types.includes('country')
          );

          if (countryComponent) {
            const geocodeResult: GeocodeResult = {
              country: countryComponent.long_name,
              countryCode: countryComponent.short_name,
              formattedAddress: result.formatted_address
            };

            const duration = logger.endTimer('reverse-geocode', 'Reverse geocoding successful');
            logger.perf('Reverse geocoding', duration, {
              country: geocodeResult.country,
              countryCode: geocodeResult.countryCode
            });

            return geocodeResult;
          }
        }
      }

      logger.endTimer('reverse-geocode');
      logger.warn('No country found in geocoding results', { location }, 'GeocodingService');
      return null;

    } catch (error) {
      logger.endTimer('reverse-geocode');
      logger.error('Reverse geocoding failed', error, 'GeocodingService');
      return null;
    }
  }

  /**
   * Check if geocoding service is available
   */
  isAvailable(): boolean {
    return this.geocoder !== null;
  }
}