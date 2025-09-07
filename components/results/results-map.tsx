'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { mapsManager } from '@/lib/maps';
import { Location } from '@/lib/types';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';

interface ResultsMapProps {
  actualLocation: Location;
  guessedLocation: Location;
}

function ResultsMapComponent({ actualLocation, guessedLocation }: ResultsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const isInitializedRef = useRef(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging to track what locations the results map receives
  logger.info('🗺️ ResultsMap received locations', {
    actualLocation,
    guessedLocation,
    timestamp: Date.now()
  }, 'ResultsMap');

  // Memoize location key to prevent unnecessary re-renders
  const locationKey = useMemo(() => 
    `${actualLocation.lat},${actualLocation.lng}-${guessedLocation.lat},${guessedLocation.lng}`,
    [actualLocation, guessedLocation]
  );

  const cleanupMap = useCallback(() => {
    // Clean up markers
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];

    // Clean up polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Clean up map
    if (mapRef.current) {
      google.maps.event.clearInstanceListeners(mapRef.current);
      mapRef.current = null;
    }
    
    isInitializedRef.current = false;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeResultsMap = async () => {
      if (!containerRef.current || !isMounted) return;

      try {
        setIsLoading(true);
        setError(null);

        // Clean up previous map if it exists
        cleanupMap();

        const initMap = () => {
          if (!isMounted || !containerRef.current) return;

          try {
            // Create results map
            const map = mapsManager.createResultsMap(
              containerRef.current,
              actualLocation,
              guessedLocation
            );
            
            if (!isMounted) {
              // Clean up if component unmounted during creation
              google.maps.event.clearInstanceListeners(map);
              return;
            }

            mapRef.current = map;
            isInitializedRef.current = true;
            
            if (isMounted) {
              setIsLoading(false);
              logger.info('Results map initialized successfully', {
                actualLocation,
                guessedLocation
              }, 'ResultsMap');
            }
          } catch (err) {
            if (isMounted) {
              setError('Failed to initialize results map');
              setIsLoading(false);
              logger.error('Results map initialization failed', err, 'ResultsMap');
            }
          }
        };

        // Ensure Google Maps is loaded
        if (!mapsManager.isInitialized()) {
          await mapsManager.initialize();
        }

        if (!isMounted) return;

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          requestIdleCallback(initMap);
        } else {
          setTimeout(initMap, 0);
        }

      } catch (err) {
        if (isMounted) {
          setError('Failed to initialize results map');
          setIsLoading(false);
          logger.error('Results map initialization failed', err, 'ResultsMap');
        }
      }
    };

    initializeResultsMap();

    // Cleanup
    return () => {
      isMounted = false;
      cleanupMap();
    };
  }, [locationKey, cleanupMap, actualLocation, guessedLocation]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Map Error</div>
          <div className="text-gray-600 dark:text-gray-300">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <div className="text-lg font-semibold">Loading Results...</div>
            <div className="text-gray-600 dark:text-gray-300 mt-2">Showing your guess vs actual location</div>
          </div>
        </div>
      )}
      
      <div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-out' }}
      />
      
      {/* Legend */}
      {!isLoading && !error && (
        <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-2 sm:px-3 sm:py-2 rounded-md sm:rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2 text-gray-800 dark:text-gray-200">Legend</div>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700 dark:text-gray-300 text-xs">Actual</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-700 dark:text-gray-300 text-xs">Your Guess</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2 h-0.5 sm:w-3 sm:h-0.5 bg-indigo-500 flex-shrink-0"></div>
              <span className="text-gray-700 dark:text-gray-300 text-xs">Distance</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const ResultsMap = React.memo(ResultsMapComponent);