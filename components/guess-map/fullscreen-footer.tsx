'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Location } from '@/lib/types';

interface FullscreenFooterProps {
  guessLocation: Location | null;
  disabled: boolean;
  onMakeGuess: () => void;
  onClearGuess: () => void;
  onExitFullscreen: () => void;
}

export function FullscreenFooter({ 
  guessLocation, 
  disabled, 
  onMakeGuess, 
  onClearGuess, 
  onExitFullscreen 
}: FullscreenFooterProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 bg-gradient-to-t from-black/70 to-transparent">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-lg border border-gray-700/50">
          {/* Mobile-first responsive layout */}
          <div className="space-y-3">
            {/* Information text - more compact on mobile */}
            <div className="text-center sm:text-left">
              {guessLocation ? (
                <div>
                  <p className="text-sm font-medium text-gray-100">
                    Guess placed at {guessLocation.lat.toFixed(4)}, {guessLocation.lng.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    Click anywhere else to change your guess
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-100">
                    Click anywhere on the map to place your guess
                  </p>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    Use the controls above to change map view and zoom level
                  </p>
                </div>
              )}
            </div>

            {/* Buttons - stacked on mobile, horizontal on desktop */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
              {/* Submit buttons - full width on mobile */}
              {guessLocation && !disabled && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={onClearGuess}
                    className="flex-1 sm:flex-none bg-gray-800/90 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-gray-100 h-10"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={onMakeGuess}
                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium shadow-lg transition-all duration-200 h-10"
                  >
                    Submit Guess
                  </Button>
                </div>
              )}
              
              {/* Exit fullscreen button */}
              <Button
                variant="outline"
                onClick={onExitFullscreen}
                className="w-full sm:w-auto bg-gray-800/90 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-gray-100 h-10"
              >
                Exit Fullscreen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}