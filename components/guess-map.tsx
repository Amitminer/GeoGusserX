'use client';

import React, { useEffect, useRef, useState, useReducer } from 'react';
import { mapsManager } from '@/lib/maps';
import { useGameStore } from '@/lib/store';
import { Location } from '@/lib/types';
import { logger } from '@/lib/logger';
import { Card } from '@/components/ui/card';
import { MiniMap } from './minimap';
import {
  MapHeader,
  MapControls,
  CoordinatesDisplay,
  MapFooter,
  FullscreenFooter,
  LoadingState,
  ErrorState,
} from './guess-map/';

interface GuessMapProps {
  onGuess: (location: Location) => void;
  disabled?: boolean;
  className?: string;
}

type MapSize = 'mini' | 'expanded' | 'fullscreen';

interface MapState {
  mapSize: MapSize;
  mapType: string;
  currentZoom: number;
  showCoordinates: boolean;
}

type MapAction =
  | { type: 'SET_MAP_SIZE'; payload: MapSize }
  | { type: 'SET_MAP_TYPE'; payload: string }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_COORDINATES' };

const initialState: MapState = {
  mapSize: 'mini',
  mapType: 'roadmap',
  currentZoom: 2,
  showCoordinates: false,
};

function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_MAP_SIZE':
      return { ...state, mapSize: action.payload };
    case 'SET_MAP_TYPE':
      return { ...state, mapType: action.payload };
    case 'SET_ZOOM':
      return { ...state, currentZoom: action.payload };
    case 'TOGGLE_COORDINATES':
      return { ...state, showCoordinates: !state.showCoordinates };
    default:
      return state;
  }
}

// Utility function to convert string mapType to Google Maps enum
const getMapTypeId = (type: string): google.maps.MapTypeId => {
  switch (type) {
    case 'satellite':
      return google.maps.MapTypeId.SATELLITE;
    case 'terrain':
      return google.maps.MapTypeId.TERRAIN;
    default:
      return google.maps.MapTypeId.ROADMAP;
  }
};

export function GuessMap({ onGuess, disabled = false, className }: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const [state, dispatch] = useReducer(mapReducer, initialState);
  const { mapSize, mapType, currentZoom, showCoordinates } = state;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guessLocation, setGuessLocation] = useState<Location | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { setMapLoaded } = useGameStore();

  const getMapSizeClasses = () => {
    switch (mapSize) {
      case 'expanded':
        return 'w-[90vw] h-[60vh] max-w-[36rem] max-h-[36rem]';
      case 'fullscreen':
        return 'fixed inset-0 w-full h-full z-50';
      default:
        return '';
    }
  };

  const getMapContainerClasses = () => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    const sizeClasses = getMapSizeClasses();

    if (mapSize === 'fullscreen') {
      return `${baseClasses} ${sizeClasses} bg-background`;
    }

    if (mapSize === 'expanded') {
      return `${baseClasses} ${sizeClasses} absolute bottom-4 right-4 origin-bottom-right`;
    }

    return '';
  };

  useEffect(() => {
    const initializeMap = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Ensure Google Maps is loaded
        if (!mapsManager.isInitialized()) {
          await mapsManager.initialize();
        }

        // Create map with custom options
        const map = new google.maps.Map(containerRef.current, {
          zoom: currentZoom,
          center: { lat: 20, lng: 0 },
          mapTypeId: getMapTypeId(mapType),
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          backgroundColor: '#1f2937',
          styles: [
            {
              featureType: 'all',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            }
          ]
        });

        mapRef.current = map;

        // Add click listener
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (disabled || !event.latLng) return;

          const location: Location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };

          setGuessLocation(location);

          // Remove existing marker
          if (markerRef.current) {
            markerRef.current.map = null;
          }

          // Create marker content
          const markerContent = document.createElement('div');
          markerContent.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `;
          markerContent.style.cursor = 'pointer';
          markerContent.title = 'Your Guess';

          // Add new marker using AdvancedMarkerElement
          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: event.latLng,
            map,
            content: markerContent,
            title: 'Your Guess'
          });

          markerRef.current = marker;

          logger.info('Guess location selected', location, 'GuessMap');
        });

        // Add zoom change listener
        map.addListener('zoom_changed', () => {
          const zoom = map.getZoom() || 2;
          dispatch({ type: 'SET_ZOOM', payload: zoom });
        });

        setIsLoading(false);
        setMapLoaded(true);
        logger.info('Guess map initialized successfully', undefined, 'GuessMap');

      } catch (err) {
        setError('Failed to initialize map');
        setIsLoading(false);
        setRetryCount(prev => prev + 1);
        logger.error('Guess map initialization failed', err, 'GuessMap');
      }
    };

    if (mapSize !== 'mini') {
      initializeMap();
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current);
      }
      if (markerRef.current) {
        markerRef.current.map = null;
      }
      if (mapSize === 'mini') {
        setMapLoaded(false);
      }
    };
  }, [disabled, setMapLoaded, mapSize, mapType]);

  // Update map type when changed
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapTypeId(getMapTypeId(mapType));
    }
  }, [mapType]);

  // Resize map when expanded/collapsed
  useEffect(() => {
    if (mapRef.current && mapSize !== 'mini') {
      setTimeout(() => {
        // Fix: Check if mapRef.current is not null before triggering resize
        if (mapRef.current) {
          google.maps.event.trigger(mapRef.current, 'resize');
        }
      }, 300);
    }
  }, [mapSize]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (mapSize === 'fullscreen' && event.key === 'Escape') {
        dispatch({ type: 'SET_MAP_SIZE', payload: 'expanded' });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mapSize]);

  const handleMakeGuess = () => {
    if (guessLocation && !disabled) {
      onGuess(guessLocation);
    }
  };

  const handleClearGuess = () => {
    if (disabled) return;

    setGuessLocation(null);
    if (markerRef.current) {
      markerRef.current.map = null;
      markerRef.current = null;
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newZoom = Math.min(currentZoom + 1, 20);
      mapRef.current.setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newZoom = Math.max(currentZoom - 1, 1);
      mapRef.current.setZoom(newZoom);
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setCenter({ lat: 20, lng: 0 });
      mapRef.current.setZoom(2);
    }
  };

  const handleCenterOnGuess = () => {
    if (mapRef.current && guessLocation) {
      mapRef.current.setCenter(guessLocation);
      mapRef.current.setZoom(Math.max(currentZoom, 8));
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
  };

  // Render mini map component when in mini state
  if (mapSize === 'mini') {
    return (
      <MiniMap
        onExpand={() => dispatch({ type: 'SET_MAP_SIZE', payload: 'expanded' })}
        className={className}
      />
    );
  }

  if (isLoading) {
    return (
      <div className={`${getMapContainerClasses()} ${className}`}>
        <LoadingState />
      </div>
    );
  }

  if (error || retryCount > 0) {
    return (
      <div className={`${getMapContainerClasses()} ${className}`}>
        <ErrorState
          error={error}
          retryCount={retryCount}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className={`${getMapContainerClasses()} ${className}`}>
      <Card className="w-full h-full flex flex-col shadow-2xl border-0 bg-gray-900/95 backdrop-blur-sm">
        {/* Header */}
        <MapHeader
          mapSize={mapSize}
          disabled={disabled}
          hasGuessLocation={!!guessLocation}
          onSetMapSize={(size) => dispatch({ type: 'SET_MAP_SIZE', payload: size })}
        />

        {/* Map Controls - Only show in expanded/fullscreen mode */}
        {(mapSize === 'expanded' || mapSize === 'fullscreen') && (
          <MapControls
            mapType={mapType}
            currentZoom={currentZoom}
            showCoordinates={showCoordinates}
            guessLocation={guessLocation}
            onSetMapType={(type) => dispatch({ type: 'SET_MAP_TYPE', payload: type })}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onCenterOnGuess={handleCenterOnGuess}
            onToggleCoordinates={() => dispatch({ type: 'TOGGLE_COORDINATES' })}
          />
        )}

        {/* Coordinates Display */}
        {showCoordinates && guessLocation && (
          <CoordinatesDisplay guessLocation={guessLocation} />
        )}

        {/* Map Container */}
        <div className="flex-1 min-h-0 relative">
          <div
            ref={containerRef}
            className="w-full h-full rounded-b-lg overflow-hidden"
            style={{ cursor: disabled ? 'not-allowed' : 'crosshair' }}
            role="application"
            aria-label="Interactive world map for location guessing"
            tabIndex={0}
          />

          {/* Overlay for submitted state */}
          {disabled && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-b-lg">
              <div className="bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-700/50">
                <p className="text-sm font-medium text-gray-100">Guess submitted!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Only show in expanded mode */}
        {mapSize === 'expanded' && (
          <MapFooter
            guessLocation={guessLocation}
            disabled={disabled}
            onMakeGuess={handleMakeGuess}
            onClearGuess={handleClearGuess}
          />
        )}

        {/* Fullscreen Footer */}
        {mapSize === 'fullscreen' && (
          <FullscreenFooter
            guessLocation={guessLocation}
            disabled={disabled}
            onMakeGuess={handleMakeGuess}
            onClearGuess={handleClearGuess}
            onExitFullscreen={() => dispatch({ type: 'SET_MAP_SIZE', payload: 'expanded' })}
          />
        )}
      </Card>
    </div>
  );
}