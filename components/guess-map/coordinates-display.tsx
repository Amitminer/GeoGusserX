'use client';

import React from 'react';
import { Location } from '@/lib/types';

interface CoordinatesDisplayProps {
  guessLocation: Location;
}

export function CoordinatesDisplay({ guessLocation }: CoordinatesDisplayProps) {
  return (
    <div className="px-3 py-2 bg-blue-900/50 border-b flex-shrink-0">
      <p className="text-xs text-blue-200">
        <span className="font-medium">Selected:</span> {guessLocation.lat.toFixed(6)}, {guessLocation.lng.toFixed(6)}
      </p>
    </div>
  );
}