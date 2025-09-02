import type { Location, StreetViewLocation, StreetViewOptions } from './types';
import { logger } from '../logger';
import { generateRandomLocation, generateLocationByCountry, isValidLocation } from '../locations';

export class StreetViewService {
	private streetViewService: google.maps.StreetViewService | null = null;

	constructor() {
		this.streetViewService = new google.maps.StreetViewService();
	}
	/**
	 * Generate a random location with available Street View
	 * @param countryName - Optional country name to restrict location generation
	 */
	async getRandomStreetViewLocation(countryName?: string): Promise<StreetViewLocation> {
		logger.startTimer('streetview-location-generation');
		const maxAttempts = 50;
		let attempts = 0;
		let lastValidLocation: Location | null = null;

		while (attempts < maxAttempts) {
			attempts++;

			try {
				logger.startTimer(`streetview-check-${attempts}`);

				// Generate location with validation
				const randomLocation = countryName
					? generateLocationByCountry(countryName, 10)
					: generateRandomLocation(10);

				// Validate the generated location
				if (!isValidLocation(randomLocation)) {
					logger.warn('Generated invalid location, skipping', { location: randomLocation, attempt: attempts }, 'StreetViewService');
					logger.endTimer(`streetview-check-${attempts}`);
					continue;
				}

				lastValidLocation = randomLocation;
				const streetViewData = await this.checkStreetViewAvailability(randomLocation);
				const checkDuration = logger.endTimer(`streetview-check-${attempts}`);

				if (streetViewData && this.validateStreetViewData(streetViewData)) {
					const finalLocation = {
						lat: streetViewData.location!.latLng!.lat(),
						lng: streetViewData.location!.latLng!.lng()
					};

					// Final validation of Street View location
					if (!isValidLocation(finalLocation)) {
						logger.warn('Street View returned invalid location', { finalLocation, originalLocation: randomLocation }, 'StreetViewService');
						continue;
					}

					const totalDuration = logger.endTimer('streetview-location-generation', 'Found valid Street View location');
					logger.perf('Street View location generation', totalDuration, {
						attempts,
						avgCheckTime: checkDuration,
						location: finalLocation,
						countryName: countryName || 'random'
					});

					return {
						location: finalLocation,
						panoId: streetViewData.location!.pano,
						heading: Math.random() * 360,
						pitch: -10 + Math.random() * 20,
						zoom: 1
					};
				}
			} catch (error) {
				logger.endTimer(`streetview-check-${attempts}`);
				logger.warn('Street View check failed', { attempt: attempts, error, countryName }, 'StreetViewService');
			}
		}

		logger.endTimer('streetview-location-generation');

		// If we have a last valid location but no Street View, create a fallback
		if (lastValidLocation) {
			logger.warn('Using last valid location as fallback', { location: lastValidLocation }, 'StreetViewService');
			return {
				location: lastValidLocation,
				panoId: 'fallback',
				heading: Math.random() * 360,
				pitch: 0,
				zoom: 1
			};
		}

		// Ultimate fallback to a known location with Street View (Times Square, NYC)
		logger.error('Could not find any valid Street View location, using emergency fallback', { countryName }, 'StreetViewService');
		return {
			location: { lat: 40.7580, lng: -73.9855 }, // Times Square
			panoId: 'emergency-fallback',
			heading: 0,
			pitch: 0,
			zoom: 1
		};
	}

	/**
	 * Validate Street View data to ensure it's usable
	 * @param data - Street View panorama data
	 * @returns True if data is valid and usable
	 */
	private validateStreetViewData(data: google.maps.StreetViewPanoramaData): boolean {
		if (!data || !data.location || !data.location.latLng) {
			return false;
		}

		const lat = data.location.latLng.lat();
		const lng = data.location.latLng.lng();

		// Validate coordinates
		if (!isValidLocation({ lat, lng })) {
			return false;
		}

		// Check if pano ID exists
		if (!data.location.pano || data.location.pano.trim() === '') {
			return false;
		}

		return true;
	}

	private async checkStreetViewAvailability(location: Location): Promise<google.maps.StreetViewPanoramaData | null> {
		return new Promise((resolve) => {
			if (!this.streetViewService) {
				logger.error('Street View service not initialized', undefined, 'StreetViewService');
				resolve(null);
				return;
			}

			// Validate input location
			if (!isValidLocation(location)) {
				logger.warn('Invalid location provided to Street View check', { location }, 'StreetViewService');
				resolve(null);
				return;
			}

			// Set a timeout for the Street View request
			const timeoutId = setTimeout(() => {
				logger.warn('Street View request timed out', { location }, 'StreetViewService');
				resolve(null);
			}, 10000); // 10 second timeout

			try {
				// Randomize search radius for more varied gameplay
				// Smaller radius = more precise to original location
				// Larger radius = more variety but potentially further from intended area
				const minRadius = 1000;  // 1km minimum
				const maxRadius = 25000; // 25km maximum (reduced from 50km)
				const randomRadius = minRadius + Math.random() * (maxRadius - minRadius);
				
				logger.debug('Using random search radius', { 
					radius: Math.round(randomRadius), 
					location,
					minRadius,
					maxRadius
				}, 'StreetViewService');
				
				this.streetViewService.getPanorama({
					location: new google.maps.LatLng(location.lat, location.lng),
					radius: Math.round(randomRadius),
					source: google.maps.StreetViewSource.OUTDOOR
				}, (data, status) => {
					clearTimeout(timeoutId);

					if (status === google.maps.StreetViewStatus.OK && data) {
						resolve(data);
					} else {
						logger.debug('Street View not available', { location, status }, 'StreetViewService');
						resolve(null);
					}
				});
			} catch (error) {
				clearTimeout(timeoutId);
				logger.error('Error in Street View request', { error, location }, 'StreetViewService');
				resolve(null);
			}
		});
	}

	/**
	 * Detect if the device is mobile
	 */
	private isMobileDevice(): boolean {
		return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
			(typeof navigator.maxTouchPoints !== 'undefined' && navigator.maxTouchPoints > 2);
	}

	/**
	 * Create a Street View panorama with validation and mobile optimization
	 */
	createStreetView(container: HTMLElement, location: StreetViewLocation): google.maps.StreetViewPanorama {
		logger.startTimer('streetview-creation');

		// Validate inputs
		if (!container) {
			throw new Error('Container element is required for Street View');
		}

		if (!location || !isValidLocation(location.location)) {
			throw new Error('Valid location is required for Street View');
		}

		try {
			const isMobile = this.isMobileDevice();

			const options: StreetViewOptions = {
				position: new google.maps.LatLng(location.location.lat, location.location.lng),
				pov: {
					heading: Math.max(0, Math.min(360, location.heading || 0)),
					pitch: Math.max(-90, Math.min(90, location.pitch || 0))
				},
				zoom: Math.max(0, Math.min(5, location.zoom || 1)),
				addressControl: false,
				linksControl: false,
				panControl: false,
				enableCloseButton: false,
				showRoadLabels: false,
				motionTracking: false,
				gestureHandling: 'greedy',
				motionTrackingControl: false
			};

			const panorama = new google.maps.StreetViewPanorama(container, options);

			// Mobile-specific optimizations
			if (isMobile) {
				container.style.touchAction = 'none';
				container.style.userSelect = 'none';

				panorama.addListener('idle', () => {
					if (container.style.transform === '') {
						container.style.transform = 'translateZ(0)';
					}
				});
			}

			// Add error handling for panorama
			panorama.addListener('status_changed', () => {
				const status = panorama.getStatus();
				if (status !== google.maps.StreetViewStatus.OK) {
					logger.warn('Street View panorama status changed', { status, panoId: location.panoId }, 'StreetViewService');
				}
			});

			const duration = logger.endTimer('streetview-creation', 'Street View panorama created');
			logger.perf('Street View creation', duration, { panoId: location.panoId, location: location.location });

			return panorama;
		} catch (error) {
			logger.endTimer('streetview-creation');
			logger.error('Failed to create Street View panorama', { error, location }, 'StreetViewService');
			throw new Error(`Failed to create Street View: ${error}`);
		}
	}
}
