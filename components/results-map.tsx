'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { mapsManager } from '@/lib/maps';
import { Location } from '@/lib/types';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';

interface ResultsMapProps {
  actualLocation: Location;
  guessedLocation: Location;
}

export function ResultsMap({ actualLocation, guessedLocation }: ResultsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeResultsMap = async () => {
      if (!containerRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // Ensure Google Maps is loaded
        if (!mapsManager.isInitialized()) {
          await mapsManager.initialize();
        }

        // Create results map
        const map = mapsManager.createResultsMap(
          containerRef.current,
          actualLocation,
          guessedLocation
        );
        mapRef.current = map;

        setIsLoading(false);
        logger.info('Results map initialized successfully', {
          actualLocation,
          guessedLocation
        }, 'ResultsMap');

      } catch (err) {
        setError('Failed to initialize results map');
        setIsLoading(false);
        logger.error('Results map initialization failed', err, 'ResultsMap');
      }
    };

    initializeResultsMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current);
      }
    };
  }, [actualLocation, guessedLocation]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800"
      >
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Map Error</div>
          <div className="text-gray-600 dark:text-gray-300">{error}</div>
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
          className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 z-10"
        >
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <div className="text-lg font-semibold">Loading Results...</div>
            <div className="text-gray-600 dark:text-gray-300 mt-2">Showing your guess vs actual location</div>
          </div>
        </motion.div>
      )}
      
      <motion.div
        ref={containerRef}
        className="w-full h-full rounded-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isLoading ? 0 : 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Legend */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-2 sm:px-3 sm:py-2 rounded-md sm:rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
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
        </motion.div>
      )}
    </div>
  );
}