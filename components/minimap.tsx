import React, { useEffect, useRef, useState } from 'react';
import { Globe, Expand, EyeOff } from 'lucide-react';
import { mapsManager } from '@/lib/maps';
import { darkMapStyles } from '@/lib/utils';

interface MiniMapProps {
	onExpand: () => void;
	onHide?: () => void;
	className?: string;
	onMapStateChange?: (center: { lat: number; lng: number }, zoom: number) => void;
}

export function MiniMap({ onExpand, onHide, className, onMapStateChange }: MiniMapProps) {
	const mapRef = useRef<HTMLDivElement>(null);
	const mapInstanceRef = useRef<google.maps.Map | null>(null);
	const [isMapLoaded, setIsMapLoaded] = useState(false);

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

			try {
				// Ensure Google Maps is loaded
				if (!mapsManager.isInitialized()) {
					await mapsManager.initialize();
				}

				// Create a simple world map for the minimap
				map = new google.maps.Map(mapRef.current, {
					zoom: 1,
					center: { lat: 20, lng: 0 },
					mapTypeId: google.maps.MapTypeId.ROADMAP,
					disableDefaultUI: true,
					gestureHandling: 'cooperative', // Allow zoom with Ctrl+scroll or two-finger scroll
					zoomControl: true, // Enable zoom controls
					zoomControlOptions: {
						position: google.maps.ControlPosition.TOP_RIGHT
					},
					mapTypeControl: false,
					scaleControl: false,
					streetViewControl: false,
					fullscreenControl: false,
					styles: darkMapStyles
				});

				// Add listeners for map state changes
				if (onMapStateChange) {
					map.addListener('center_changed', () => {
						const center = map!.getCenter();
						const zoom = map!.getZoom();
						if (center && zoom) {
							onMapStateChange(
								{ lat: center.lat(), lng: center.lng() },
								zoom
							);
						}
					});
					map.addListener('zoom_changed', () => {
						const center = map!.getCenter();
						const zoom = map!.getZoom();
						if (center && zoom) {
							onMapStateChange(
								{ lat: center.lat(), lng: center.lng() },
								zoom
							);
						}
					});
				}

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
		};
	}, [onMapStateChange]);

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
							Make your guess (zoomable)
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
						style={{ opacity: isMapLoaded ? 1 : 0 }}
						onDoubleClick={handleDoubleClick}
					/>
				</div>
			</div>
		</div>
	);
}
