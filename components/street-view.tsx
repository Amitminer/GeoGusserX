'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { mapsManager } from '@/lib/maps';
import { useGameStore } from '@/lib/storage/store';
import { StreetViewLocation } from '@/lib/types';
import { logger } from '@/lib/logger';
import { shouldShowCountryName } from '@/lib/utils';
import { Loader2, MapPin } from 'lucide-react';
import type { GeocodeResult } from '@/lib/maps/geocoding';

interface StreetViewProps {
	location: StreetViewLocation;
	onLocationChange?: (location: StreetViewLocation) => void;
}

export function StreetView({ location, onLocationChange }: StreetViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [countryInfo, setCountryInfo] = useState<GeocodeResult | null>(null);
	const [showCountryName] = useState(() => shouldShowCountryName());

	const { setStreetViewLoaded } = useGameStore();

	useEffect(() => {
		const initializeStreetView = async () => {
			if (!containerRef.current) return;

			try {
				setIsLoading(true);
				setError(null);

				// Ensure Google Maps is loaded
				if (!mapsManager.isInitialized()) {
					await mapsManager.initialize();
				}

				// Create Street View panorama
				const panorama = mapsManager.createStreetView(containerRef.current, location);
				panoramaRef.current = panorama;

				// Set up event listeners
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

				// Wait for Street View to load
				panorama.addListener('status_changed', async () => {
					const status = panorama.getStatus();
					if (status === google.maps.StreetViewStatus.OK) {
						setIsLoading(false);
						setStreetViewLoaded(true);
						logger.info('Street View loaded successfully', { location }, 'StreetView');

						// Get country information if enabled
						if (showCountryName) {
							try {
								const geocodingService = mapsManager.getGeocodingService();
								if (geocodingService) {
									const result = await geocodingService.getCountryFromCoordinates(location.location);
									if (result) {
										setCountryInfo(result);
										logger.info('Country information retrieved', { country: result.country }, 'StreetView');
									}
								}
							} catch (error) {
								logger.error('Failed to get country information', error, 'StreetView');
							}
						}
					} else {
						setError('Street View not available for this location');
						setIsLoading(false);
						logger.error('Street View failed to load', { status, location }, 'StreetView');
					}
				});

			} catch (err) {
				setError('Failed to initialize Street View');
				setIsLoading(false);
				logger.error('Street View initialization failed', err, 'StreetView');
			}
		};

		initializeStreetView();

		// Cleanup
		return () => {
			if (panoramaRef.current) {
				google.maps.event.clearInstanceListeners(panoramaRef.current);
			}
			setStreetViewLoaded(false);
			setCountryInfo(null);
		};
	}, [location, onLocationChange, setStreetViewLoaded, showCountryName]);

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

			{/* Street View Controls Overlay */}
			{!isLoading && !error && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm"
				>
					Use mouse to look around • WASD or arrow keys to move
				</motion.div>
			)}

			{/* Country Name Overlay */}
			{!isLoading && !error && showCountryName && countryInfo && (
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 1 }}
					className="absolute top-4 left-4 bg-blue-600/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-sm z-50"
				>
					<div className="flex items-center gap-2">
						<MapPin className="w-4 h-4" />
						<div>
							<div className="font-semibold text-sm">{countryInfo.country}</div>
							<div className="text-xs text-blue-100">{countryInfo.countryCode}</div>
						</div>
					</div>
				</motion.div>
			)}
		</div>
	);
}
