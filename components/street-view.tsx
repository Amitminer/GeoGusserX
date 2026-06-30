'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { mapsManager } from '@/lib/maps';
import { logger } from '@/lib/logger';
import { StreetViewLocation } from '@/lib/types';
import type { GeocodeResult } from '@/lib/maps/geocoding';
import { StreetViewControls } from '@/components/street-view-controls';
import { useGameStore } from '@/lib/storage/store';
import { Loader2, MapPin } from 'lucide-react';

/**
 * Props for the `StreetView` component.
 */
interface StreetViewProps {
  /** The initial location to display in Street View. */
  location: StreetViewLocation;
  /** Callback function that is triggered when the user navigates to a new location. */
  onLocationChange?: (location: StreetViewLocation) => void;
  /** Callback function that is triggered when the country information for the current location is determined. */
  onCountryInfoChange?: (countryInfo: GeocodeResult | null) => void;
  /** Callback function that is triggered when an error occurs while loading Street View. */
  onStreetViewError?: (error: string) => void;
  /** Callback function to skip the current round. */
  onSkipRound?: () => void;
}

/**
 * The `StreetView` component is responsible for rendering the Google Street View panorama.
 * It handles the entire lifecycle of the panorama, including initialization, event handling,
 * and cleanup. It also fetches and displays geographic information about the current location.
 */
export function StreetView({ location, onLocationChange, onCountryInfoChange, onStreetViewError, onSkipRound }: StreetViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [countryInfo, setCountryInfo] = useState<GeocodeResult | null>(null);
	const [panoramaInstance, setPanoramaInstance] = useState<google.maps.StreetViewPanorama | null>(null);
	const { setStreetViewLoaded, gameSettings, showGameComplete } = useGameStore();

	useEffect(() => {
		let isMounted = true;

		/**
		 * This function initializes the Street View panorama. It ensures that the Google Maps API is loaded,
		 * creates a new panorama instance, and sets up all the necessary event listeners for tracking
		 * changes in position and point-of-view.
		 */
		const initializeStreetView = async () => {
			if (!containerRef.current || !isMounted || showGameComplete) return;

			// Before creating a new panorama, it's crucial to clean up any existing instance to prevent memory leaks.
			if (panoramaRef.current) {
				google.maps.event.clearInstanceListeners(panoramaRef.current);
				panoramaRef.current = null;
				setPanoramaInstance(null);
			}

			try {
				if (isMounted) {
					setIsLoading(true);
					setError(null);
				}

				if (!mapsManager.isInitialized()) {
					await mapsManager.initialize();
				}

				if (!isMounted) return;

				const panorama = mapsManager.createStreetView(containerRef.current, location);

				if (!isMounted) {
					google.maps.event.clearInstanceListeners(panorama);
					return;
				}

				panoramaRef.current = panorama;
				setPanoramaInstance(panorama);

				// These listeners notify the parent component of any changes to the panorama's state.
				panorama.addListener('position_changed', () => {
					const position = panorama.getPosition();
					if (position && onLocationChange) {
						const newLocation: StreetViewLocation = {
							location: {
								lat: position.lat(),
								lng: position.lng()
							},
							panoId: panorama.getPano(),
							heading: panorama.getPov().heading,
							pitch: panorama.getPov().pitch,
							zoom: panorama.getZoom()
						};
						onLocationChange(newLocation);
					}
				});

				panorama.addListener('pov_changed', () => {
					if (onLocationChange) {
						const position = panorama.getPosition();
						if (position) {
							const newLocation: StreetViewLocation = {
								location: {
									lat: position.lat(),
									lng: position.lng()
								},
								panoId: panorama.getPano(),
								heading: panorama.getPov().heading,
								pitch: panorama.getPov().pitch,
								zoom: panorama.getZoom()
							};
							onLocationChange(newLocation);
						}
					}
				});

				// The 'status_changed' event is the most reliable way to know if the panorama has loaded successfully.
				panorama.addListener('status_changed', async () => {
					if (!isMounted) return;

					const status = panorama.getStatus();
					if (status === google.maps.StreetViewStatus.OK) {
						if (isMounted) {
							setIsLoading(false);
							setStreetViewLoaded(true);
							logger.info('Street View loaded successfully', { location }, 'StreetView');
						}

						/**
						 * Once the panorama is loaded, we can fetch the country information.
						 * `requestIdleCallback` is used to defer this work until the browser is idle,
						 * which helps to keep the UI responsive.
						 */
						if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
							requestIdleCallback(async () => {
								if (!isMounted || showGameComplete) return;
								try {
									const geocodingService = mapsManager.getGeocodingService();
									if (geocodingService) {
										const panoramaPosition = panorama.getPosition();
										if (panoramaPosition) {
											const actualCoordinates = {
												lat: panoramaPosition.lat(),
												lng: panoramaPosition.lng()
											};

											const result = await geocodingService.getCountryFromCoordinates(actualCoordinates);
											if (result && isMounted && !showGameComplete) {
												setCountryInfo(result);
												if (onCountryInfoChange) {
													onCountryInfoChange(result);
												}
												logger.info('Country information retrieved', {
													country: result.country,
													actualCoordinates,
													initialCoordinates: location.location
												}, 'StreetView');
											}
										} else {
											logger.warn('Panorama position is null, cannot geocode', {}, 'StreetView');
											if (onCountryInfoChange && isMounted && !showGameComplete) {
												onCountryInfoChange(null);
											}
										}
									}
								} catch (error) {
									logger.error('Failed to get country information', error, 'StreetView');
									if (onCountryInfoChange && isMounted && !showGameComplete) {
										onCountryInfoChange(null);
									}
								}
							});
						} else {
							// Fallback for older browsers that do not support `requestIdleCallback`.
							setTimeout(async () => {
								if (!isMounted || showGameComplete) return;
								try {
									const geocodingService = mapsManager.getGeocodingService();
									if (geocodingService) {
										const panoramaPosition = panorama.getPosition();
										if (panoramaPosition) {
											const actualCoordinates = {
												lat: panoramaPosition.lat(),
												lng: panoramaPosition.lng()
											};
											const result = await geocodingService.getCountryFromCoordinates(actualCoordinates);
											if (result && isMounted && !showGameComplete) {
												setCountryInfo(result);
												if (onCountryInfoChange) {
													onCountryInfoChange(result);
												}
											}
										}
									}
								} catch (error) {
									logger.error('Failed to get country information', error, 'StreetView');
									if (onCountryInfoChange && isMounted && !showGameComplete) {
										onCountryInfoChange(null);
									}
								}
							}, 100);
						}
					} else {
						if (isMounted) {
							const errorMessage = 'Street View not available for this location';
							setError(errorMessage);
							setIsLoading(false);
							logger.error('Street View failed to load', { status, location }, 'StreetView');

							if (onStreetViewError) {
								onStreetViewError(errorMessage);
							}
						}
					}
				});

			} catch (err) {
				if (isMounted) {
					const errorMessage = 'Failed to initialize Street View';
					setError(errorMessage);
					setIsLoading(false);
					logger.error('Street View initialization failed', err, 'StreetView');

					if (onStreetViewError) {
						onStreetViewError(errorMessage);
					}
				}
			}
		};

		initializeStreetView();

		// The cleanup function is essential for preventing memory leaks and unexpected behavior.
		return () => {
			isMounted = false;
			if (panoramaRef.current) {
				google.maps.event.clearInstanceListeners(panoramaRef.current);
				panoramaRef.current = null;
			}
			setStreetViewLoaded(false);
			setCountryInfo(null);
			if (onCountryInfoChange) {
				onCountryInfoChange(null);
			}
		};
	}, [location, onLocationChange, onCountryInfoChange, onStreetViewError, setStreetViewLoaded, showGameComplete]);

	useEffect(() => {
		logger.debug('Country name overlay setting changed', {
			showCountryName: gameSettings.showCountryName
		}, 'StreetView');
	}, [gameSettings.showCountryName]);

	if (error) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="flex items-center justify-center h-full bg-gray-900 text-white"
			>
				<div className="text-center">
					<div className="text-xl font-semibold mb-2">Street View Error</div>
					<div className="text-gray-300">{error}</div>
				</div>
			</motion.div>
		);
	}

	return (
		<div className="relative w-full h-full">
			{/* The loading indicator is displayed while the Street View panorama is being initialized. */}
			{isLoading && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10"
				>
					<div className="text-center">
						<Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
						<div className="text-lg font-semibold">Loading Street View...</div>
						<div className="text-gray-300 mt-2">Finding the perfect location</div>
					</div>
				</motion.div>
			)}

			<motion.div
				ref={containerRef}
				className="w-full h-full"
				initial={{ opacity: 0 }}
				animate={{ opacity: isLoading ? 0 : 1 }}
				transition={{ duration: 0.5 }}
			/>

			{/* This div acts as a click blocker to prevent users from clicking on the Google Maps watermark, which could navigate them away from the game. */}
			<div className="absolute bottom-0 left-0 w-[120px] h-[40px] z-20 bg-transparent pointer-events-auto" />

			{!isLoading && !error && (
				<StreetViewControls
					panorama={panoramaInstance}
					showControls={true}
					onSkipRound={onSkipRound}
				/>
			)}

			{/* This overlay provides helpful instructions for desktop users. */}
			{!isLoading && !error && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm hidden md:block"
				>
					Use mouse to look around • WASD or arrow keys to move
				</motion.div>
			)}

			{/* This overlay displays the country name if the setting is enabled. */}
			{!isLoading && !error && gameSettings.showCountryName && countryInfo && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1 }}
					className="absolute top-4 left-4 bg-blue-600/95 text-white px-3 py-2 rounded-xl shadow-lg backdrop-blur-sm z-30 border border-blue-500/30"
				>
					<div className="flex items-center gap-2">
						<MapPin className="w-4 h-4 text-blue-200" />
						<div>
							<div className="font-semibold text-sm">{countryInfo.country}</div>
							{countryInfo.countryCode && (
								<div className="text-xs text-blue-200">{countryInfo.countryCode}</div>
							)}
						</div>
					</div>
				</motion.div>
			)}
		</div>
	);
}