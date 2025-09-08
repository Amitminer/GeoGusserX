import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Globe, Expand, EyeOff, Send } from 'lucide-react';
import { mapsManager } from '@/lib/maps';
import { darkMapStyles } from '@/lib/utils';

interface MiniMapProps {
	onExpand: () => void;
	onHide?: () => void;
	className?: string;
	onMapStateChange?: (center: { lat: number; lng: number }, zoom: number) => void;
	onQuessPlaced?: (location: { lat: number; lng: number }) => void;
	onSubmitGuess?: () => void;
	hasGuess?: boolean;
	disabled?: boolean;
}

export function MiniMap({ onExpand, onHide, className, onMapStateChange, onQuessPlaced, onSubmitGuess, hasGuess = false, disabled = false }: MiniMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<google.maps.Map | null>(null);
	const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
	const [isMapLoaded, setIsMapLoaded] = useState(false);

	// Handle single click to place guess (not submit) - memoized to prevent re-renders
	const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
		if (disabled || !event.latLng || !onQuessPlaced || !mapInstanceRef.current) return;

		const location = {
			lat: event.latLng.lat(),
			lng: event.latLng.lng()
		};

		// Remove existing marker
		if (markerRef.current) {
			markerRef.current.map = null;
			markerRef.current = null;
		}

		// Create custom marker using AdvancedMarkerElement (works without Map ID)
		const markerContent = document.createElement('div');
		markerContent.innerHTML = `
			<div style="
				position: relative;
				width: 24px;
				height: 24px;
				cursor: pointer;
				filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
			">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" stroke="#ffffff" stroke-width="1"/>
					<circle cx="12" cy="9" r="2.5" fill="white"/>
				</svg>
			</div>
		`;

		const marker = new google.maps.marker.AdvancedMarkerElement({
			position: event.latLng,
			map: mapInstanceRef.current,
			content: markerContent,
			title: 'Your Guess'
		});

		markerRef.current = marker;

		onQuessPlaced(location);
	}, [disabled, onQuessPlaced]);

	// Handle double-click to expand
	const handleDoubleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onExpand();
	};

	useEffect(() => {
		let map: google.maps.Map | null = null;

		const initMiniMap = async () => {
			if (!mapRef.current) return;

			// Clean up existing map instance if any
			if (mapInstanceRef.current) {
				google.maps.event.clearInstanceListeners(mapInstanceRef.current);
				mapInstanceRef.current = null;
			}

			// Clean up existing marker
			if (markerRef.current) {
				markerRef.current.map = null;
				markerRef.current = null;
			}

			try {
				// Ensure Google Maps is loaded
				if (!mapsManager.isInitialized()) {
					await mapsManager.initialize();
				}

				// Get Map ID to prevent warnings
				const mapId = mapsManager.getMapId();

				// Create minimap with Map ID to prevent warnings
				const mapConfig: google.maps.MapOptions = {
					zoom: 1,
					center: { lat: 20, lng: 0 },
					mapTypeId: google.maps.MapTypeId.ROADMAP,
					disableDefaultUI: true,
					gestureHandling: 'greedy', // Allow zoom on scroll without modifier keys
					zoomControl: true, // Enable zoom controls
					zoomControlOptions: {
						position: google.maps.ControlPosition.TOP_RIGHT
					},
					mapTypeControl: false,
					scaleControl: false,
					streetViewControl: false,
					fullscreenControl: false
				};

				// Add Map ID if available
				if (mapId) {
					mapConfig.mapId = mapId;
				}

				map = new google.maps.Map(mapRef.current, mapConfig);

				// Override with custom dark styles after map creation
				// I do not know why it doesnt let me override the styles
				map.setOptions({ styles: darkMapStyles });

				mapInstanceRef.current = map;
				setIsMapLoaded(true);
			} catch (error) {
				console.error('Failed to initialize minimap:', error);
			}
		};

		initMiniMap();

		// Cleanup function
		return () => {
			if (map) {
				google.maps.event.clearInstanceListeners(map);
			}
			if (mapInstanceRef.current) {
				google.maps.event.clearInstanceListeners(mapInstanceRef.current);
				mapInstanceRef.current = null;
			}
			if (markerRef.current) {
				markerRef.current.map = null;
				markerRef.current = null;
			}
		};
	}, []); // Empty dependency array - only initialize once

	// Separate effect to handle click listener updates without re-initializing the map
	useEffect(() => {
		if (!mapInstanceRef.current) return;

		// Remove existing click listeners
		google.maps.event.clearListeners(mapInstanceRef.current, 'click');

		// Add click listener if needed
		if (onQuessPlaced && !disabled) {
			mapInstanceRef.current.addListener('click', handleMapClick);
		}
	}, [onQuessPlaced, disabled, handleMapClick]);

	// Separate effect to handle map state change listeners
	useEffect(() => {
		if (!mapInstanceRef.current || !onMapStateChange) return;

		// Remove existing listeners
		google.maps.event.clearListeners(mapInstanceRef.current, 'center_changed');
		google.maps.event.clearListeners(mapInstanceRef.current, 'zoom_changed');

		// Add new listeners
		const map = mapInstanceRef.current;
		map.addListener('center_changed', () => {
			const center = map.getCenter();
			const zoom = map.getZoom();
			if (center && zoom) {
				onMapStateChange(
					{ lat: center.lat(), lng: center.lng() },
					zoom
				);
			}
		});
		map.addListener('zoom_changed', () => {
			const center = map.getCenter();
			const zoom = map.getZoom();
			if (center && zoom) {
				onMapStateChange(
					{ lat: center.lat(), lng: center.lng() },
					zoom
				);
			}
		});
	}, [onMapStateChange]);

	// Effect to clear marker when guess is cleared or component is disabled
	useEffect(() => {
		if (!hasGuess && markerRef.current) {
			markerRef.current.map = null;
			markerRef.current = null;
		}
	}, [hasGuess]);

	return (
		<div
			className={`w-80 h-64 sm:w-96 sm:h-80 fixed bottom-4 right-4 z-50 origin-bottom-right transition-all duration-300 ease-in-out pointer-events-auto ${className || ''}`}
		>
			<div className="w-full h-full flex flex-col shadow-2xl border-2 border-blue-500/50 bg-gray-900/95 backdrop-blur-sm rounded-lg overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-3 py-1.5 md:py-2 border-b bg-gray-800/90 backdrop-blur-sm flex-shrink-0">
					<div className="flex items-center gap-1 md:gap-1.5">
						<Globe className="h-4 w-4 md:h-4 md:w-4 text-blue-500" />
						<span className="text-[11px] md:text-xs font-medium text-gray-100">
							{onQuessPlaced && !disabled ? 'Click to place guess' : 'Make your guess (zoomable)'}
						</span>
					</div>
					<div className="flex items-center gap-1">
						{onHide && (
							<button
								onClick={onHide}
								className="p-1 text-[10px] md:text-xs text-gray-400 hover:text-red-300 transition-colors"
								title="Hide map"
							>
								<EyeOff className="h-5 w-5" />
							</button>
						)}
						<button
							onClick={onExpand}
							className="flex items-center gap-1 px-2 py-1 text-[11px] md:text-xs text-blue-300 hover:text-blue-200 transition-colors"
							title="Double-click map to expand"
						>
							<Expand className="h-4 w-4" />
							Expand
						</button>
					</div>
				</div>

				{/* Mini Map */}
				<div className="flex-1 relative">
					{!isMapLoaded && (
						<div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-green-900/50 flex items-center justify-center">
							<div className="text-center">
								<Globe className="w-6 h-6 mx-auto mb-1 text-blue-400 animate-pulse" />
								<div className="text-[10px] text-gray-300">
									Loading map...
								</div>
							</div>
						</div>
					)}
					<div
						ref={mapRef}
						className="w-full h-full"
						style={{
							opacity: isMapLoaded ? 1 : 0,
							cursor: disabled ? 'not-allowed' : (onQuessPlaced ? 'crosshair' : 'pointer')
						}}
						onDoubleClick={handleDoubleClick}
					/>
					{/* Disabled overlay */}
					{disabled && (
						<div className="absolute inset-0 bg-black/30 flex items-center justify-center">
							<div className="bg-gray-900/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-700/50">
								<span className="text-xs font-medium text-gray-300">Guess submitted!</span>
							</div>
						</div>
					)}
				</div>

				{/* Submit Button - appears when guess is placed */}
				{hasGuess && !disabled && onSubmitGuess && (
					<div className="px-3 py-2 border-t bg-gray-800/90 backdrop-blur-sm">
						<button
							onClick={onSubmitGuess}
							className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200"
						>
							<Send className="h-4 w-4" />
							Submit Guess
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
