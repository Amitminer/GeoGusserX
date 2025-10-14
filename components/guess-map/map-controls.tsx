'use client';

import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Location } from '@/lib/types';

/**
 * Props for the `MapControls` component.
 */
interface MapControlsProps {
  /** The current map type (e.g., 'roadmap', 'satellite'). */
  mapType: string;
  /** The current zoom level of the map. */
  currentZoom: number;
  /** The location of the user's current guess. */
  guessLocation: Location | null;
  /** A callback function to set the map type. */
  onSetMapType: (type: string) => void;
  /** A callback function to zoom in. */
  onZoomIn: () => void;
  /** A callback function to zoom out. */
  onZoomOut: () => void;
  /** A callback function to reset the map view to its initial state. */
  onResetView: () => void;
  /** A callback function to center the map on the user's guess. */
  onCenterOnGuess: () => void;
}

/**
 * A component that displays the controls for the guess map, including map type selection,
 * zoom controls, and other actions like resetting the view or centering on a guess.
 */
export function MapControls({
  mapType,
  currentZoom,
  guessLocation,
  onSetMapType,
  onZoomIn,
  onZoomOut,
  onResetView,
  onCenterOnGuess,
}: MapControlsProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b bg-gray-800/90 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* A group of buttons for selecting the map type. */}
        <div className="flex items-center gap-1">
          <Button
            variant={mapType === 'roadmap' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSetMapType('roadmap')}
            className={`h-7 px-2 text-xs ${
              mapType === 'roadmap' 
                ? '' 
                : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700/50'
            }`}
          >
            Road
          </Button>
          <Button
            variant={mapType === 'satellite' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSetMapType('satellite')}
            className={`h-7 px-2 text-xs ${
              mapType === 'satellite' 
                ? '' 
                : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700/50'
            }`}
          >
            Satellite
          </Button>
          <Button
            variant={mapType === 'terrain' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSetMapType('terrain')}
            className={`h-7 px-2 text-xs ${
              mapType === 'terrain' 
                ? '' 
                : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700/50'
            }`}
          >
            Terrain
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* A set of controls for zooming in and out of the map. */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          disabled={currentZoom <= 1}
          className="h-7 w-7 text-gray-300 hover:text-gray-100 hover:bg-gray-700/50 disabled:text-gray-500"
          title="Zoom out"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>
        <span className="text-xs text-gray-300 px-2 min-w-[3rem] text-center">
          {currentZoom}x
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          disabled={currentZoom >= 20}
          className="h-7 w-7 text-gray-300 hover:text-gray-100 hover:bg-gray-700/50 disabled:text-gray-500"
          title="Zoom in"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>

        {/* A button to reset the map to its initial view. */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onResetView}
          className="h-7 w-7 text-gray-300 hover:text-gray-100 hover:bg-gray-700/50"
          title="Reset view"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        {/* A button to center the map on the user's current guess. */}
        {guessLocation && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCenterOnGuess}
            className="h-7 w-7 text-gray-300 hover:text-gray-100 hover:bg-gray-700/50"
            title="Center on your guess"
          >
            <Navigation className="h-3 w-3" />
          </Button>
        )}


      </div>
    </div>
  );
}