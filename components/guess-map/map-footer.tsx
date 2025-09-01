'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Location } from '@/lib/types';

interface MapFooterProps {
  guessLocation: Location | null;
  disabled: boolean;
  onMakeGuess: () => void;
  onClearGuess: () => void;
}

export function MapFooter({ guessLocation, disabled, onMakeGuess, onClearGuess }: MapFooterProps) {
  return (
    <div className="p-3 border-t bg-gray-800/90 backdrop-blur-sm flex-shrink-0">
      <div className="space-y-2">
        {guessLocation && (
          <div className="text-xs text-gray-400 text-center">
            Guess placed at {guessLocation.lat.toFixed(4)}, {guessLocation.lng.toFixed(4)}
          </div>
        )}

        <div className="text-xs text-center text-gray-400">
          <kbd className="px-1 py-0.5 bg-gray-700 text-gray-200 rounded text-xs">Click</kbd> to place guess •
          <kbd className="px-1 py-0.5 bg-gray-700 text-gray-200 rounded text-xs ml-1">Scroll</kbd> to zoom
        </div>

        {/* Submit Button - Show when location is selected */}
        {guessLocation && !disabled && (
          <div className="flex justify-center mt-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearGuess}
              className="h-6 px-2 text-xs bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
            >
              Clear
            </Button>
            <Button
              onClick={onMakeGuess}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-xs font-medium shadow-lg transition-all duration-200"
            >
              Submit Guess
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}