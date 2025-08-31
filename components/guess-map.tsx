'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { mapsManager } from '@/lib/maps';
import { useGameStore } from '@/lib/store';
import { Location } from '@/lib/types';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';

interface GuessMapProps {
  onGuess: (location: Location) => void;
  disabled?: boolean;
}

export function GuessMap({ onGuess, disabled = false }: GuessMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guessLocation, setGuessLocation] = useState<Location | null>(null);
  
  const { setMapLoaded } = useGameStore();

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

        // Create map
        const map = mapsManager.createMap(containerRef.current);
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

        setIsLoading(false);
        setMapLoaded(true);
        logger.info('Guess map initialized successfully', undefined, 'GuessMap');

      } catch (err) {
        setError('Failed to initialize map');
        setIsLoading(false);
        logger.error('Guess map initialization failed', err, 'GuessMap');
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current);
      }
      if (markerRef.current) {
        markerRef.current.map = null;
      }
      setMapLoaded(false);
    };
  }, [disabled, setMapLoaded]);

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
            <div className="text-lg font-semibold">Loading Map...</div>
            <div className="text-gray-600 dark:text-gray-300 mt-2">Preparing your guessing interface</div>
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
      
      {/* Map Controls */}
      {!isLoading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-4 left-4 right-4 flex items-center justify-between"
        >
          <div className="bg-white dark:bg-gray-800 px-3 py-2 rounded-lg shadow-lg text-sm">
            {guessLocation ? (
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-red-500" />
                Guess placed! Click &quot;Make Guess&quot; to confirm.
              </span>
            ) : (
              <span>Click anywhere on the map to place your guess</span>
            )}
          </div>
          
          <div className="flex gap-2">
            {guessLocation && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearGuess}
                disabled={disabled}
              >
                Clear
              </Button>
            )}
            
            <Button
              onClick={handleMakeGuess}
              disabled={!guessLocation || disabled}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {disabled ? 'Guess Made' : 'Make Guess'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}