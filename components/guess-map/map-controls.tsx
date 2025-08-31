'use client';

import React from 'react';
import { RotateCcw, ZoomIn, ZoomOut, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Location } from '@/lib/types';

interface MapControlsProps {
  mapType: string;
  currentZoom: number;
  showCoordinates: boolean;
  guessLocation: Location | null;
  onSetMapType: (type: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onCenterOnGuess: () => void;
  onToggleCoordinates: () => void;
}

export function MapControls({
  mapType,
  currentZoom,
  showCoordinates,
  guessLocation,
  onSetMapType,
  onZoomIn,
  onZoomOut,
  onResetView,
  onCenterOnGuess,
  onToggleCoordinates,
}: MapControlsProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b bg-gray-800/90 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-2">
        {/* Map Type Selector */}
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
        {/* Zoom Controls */}
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

        {/* Reset View */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onResetView}
          className="h-7 w-7 text-gray-300 hover:text-gray-100 hover:bg-gray-700/50"
          title="Reset view"
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        {/* Center on Guess */}
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

        {/* Coordinates Toggle */}
        <Button
          variant={showCoordinates ? 'default' : 'ghost'}
          size="sm"
          onClick={onToggleCoordinates}
          className={`h-7 px-2 text-xs ${
            showCoordinates 
              ? '' 
              : 'text-gray-300 hover:text-gray-100 hover:bg-gray-700/50'
          }`}
          title="Show coordinates"
        >
          XY
        </Button>
      </div>
    </div>
  );
}