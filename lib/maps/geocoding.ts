import { logger } from '../logger';
import type { Location } from './types';

/**
 * Defines the structure for the result of a reverse geocoding operation.
 */
export interface GeocodeResult {
  /** The full name of the country. */
  country: string;
  /** The ISO 3166-1 alpha-2 country code. */
  countryCode: string;
  /** The fully formatted address string. */
  formattedAddress: string;
}

/**
 * A service class that encapsulates the Google Maps Geocoding API.
 * It provides methods for reverse geocoding coordinates to determine the country.
 */
export class GeocodingService {
  private geocoder: google.maps.Geocoder | null = null;

  constructor() {
    if (typeof google !== 'undefined' && google.maps) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Initializes the geocoding service.
   */
  initialize(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.geocoder = new google.maps.Geocoder();
    }
  }

  /**
   * Retrieves country information from a given set of coordinates using reverse geocoding.
   * It iterates through the geocoding results to find the component that represents the country.
   *
   * @param location The geographical coordinates to be reverse geocoded.
   * @returns A promise that resolves with a `GeocodeResult` object if successful, otherwise null.
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
        // The geocoding service can return multiple results. We iterate through them to find the most reliable country information.
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
   * Checks if the geocoding service is available and has been initialized.
   * @returns `true` if the service is available, `false` otherwise.
   */
  isAvailable(): boolean {
    return this.geocoder !== null;
  }
}