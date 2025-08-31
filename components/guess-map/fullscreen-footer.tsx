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
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {guessLocation ? (
                <div>
                  <p className="text-sm font-medium text-gray-100">
                    Guess placed at {guessLocation.lat.toFixed(4)}, {guessLocation.lng.toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Click anywhere else to change your guess
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-100">
                    Click anywhere on the map to place your guess
                  </p>
                  <p className="text-xs text-gray-400">
                    Use the controls above to change map view and zoom level
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Submit Button in Fullscreen */}
              {guessLocation && !disabled && (
                <>
                  <Button
                    variant="outline"
                    onClick={onClearGuess}
                    className="bg-gray-800/90 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-gray-100"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={onMakeGuess}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 font-medium shadow-lg transition-all duration-200"
                  >
                    Submit Guess
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={onExitFullscreen}
                className="bg-gray-800/90 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-gray-100"
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