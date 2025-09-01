import type { Location, StreetViewLocation, StreetViewOptions } from './types';
import { logger } from '../logger';
import { generateRandomLocation } from '../locations';

export class StreetViewService {
	private streetViewService: google.maps.StreetViewService | null = null;

	constructor() {
		this.streetViewService = new google.maps.StreetViewService();
	}
	/**
	 * Generate a random location with available Street View
	 */
	async getRandomStreetViewLocation(): Promise<StreetViewLocation> {
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
				logger.warn('Street View check failed', { attempt: attempts, error }, 'StreetViewService');
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
		logger.startTimer('streetview-creation');

		const options: StreetViewOptions = {
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
		};

		const panorama = new google.maps.StreetViewPanorama(container, options);

		const duration = logger.endTimer('streetview-creation', 'Street View panorama created');
		logger.perf('Street View creation', duration, { panoId: location.panoId });

		return panorama;
	}
}
