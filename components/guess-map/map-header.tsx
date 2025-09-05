'use client';

import React from 'react';
import { Globe, Minimize2, Target, X, EyeOff, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type MapSize = 'mini' | 'expanded' | 'fullscreen' | 'hidden';

interface MapHeaderProps {
  mapSize: MapSize;
  disabled: boolean;
  hasGuessLocation: boolean;
  onSetMapSize: (size: MapSize) => void;
  onReloadMap?: () => void;
}

export function MapHeader({ mapSize, disabled, hasGuessLocation, onSetMapSize, onReloadMap }: MapHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-1.5 md:py-2 border-b bg-gray-800/90 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-1 md:gap-1.5">
        <Globe className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
        <span className="text-[10px] md:text-xs font-medium text-gray-100">
          {mapSize === 'fullscreen' ? 'World Map - Make Your Guess' : 'Make your guess'}
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-1.5">
        {/* Status Badge */}
        <Badge
          variant={disabled ? 'default' : hasGuessLocation ? 'secondary' : 'outline'}
          className={`text-[9px] md:text-[10px] px-1 md:px-1.5 py-0.5 ${
            disabled
              ? 'bg-green-500 text-white'
              : hasGuessLocation
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-gray-700/50 text-gray-300 border-gray-600/30'
          }`}
        >
          {disabled ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              Submitted
            </div>
          ) : hasGuessLocation ? (
            'Ready to submit'
          ) : (
            'Click to guess'
          )}
        </Badge>

        {/* Reload Map Button - Show in expanded/fullscreen modes */}
        {(mapSize === 'expanded' || mapSize === 'fullscreen') && onReloadMap && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onReloadMap}
            className="h-6 w-6 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-blue-300"
            title="Reload map"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}

        {/* Size Controls */}
        {mapSize !== 'fullscreen' && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSetMapSize('hidden')}
              className="h-6 w-6 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-red-300"
              title="Hide map"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onSetMapSize('mini')}
              className="h-6 w-6 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100"
              title="Minimize map"
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
          </>
        )}

        {mapSize === 'expanded' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSetMapSize('fullscreen')}
            className="h-6 w-6 hover:bg-gray-700/50 transition-colors text-gray-300 hover:text-gray-100"
            title="Open fullscreen"
          >
            <Target className="h-3 w-3" />
          </Button>
        )}

        {mapSize === 'fullscreen' && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSetMapSize('expanded')}
            className="h-6 w-6 hover:bg-red-900/50 transition-colors text-gray-300 hover:text-red-300"
            title="Exit fullscreen (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}