'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Props for the `ErrorState` component.
 */
interface ErrorStateProps {
  /** The error message to be displayed. */
  error: string | null;
  /** The number of times the operation has been retried. */
  retryCount: number;
  /** A callback function to be triggered when the user clicks the retry button. */
  onRetry: () => void;
  /** Additional CSS classes to apply to the component. */
  className?: string;
}

/**
 * A presentational component that displays an error state for the guess map.
 * It shows an error message and provides a button to retry the operation.
 */
export function ErrorState({ error, retryCount, onRetry, className }: ErrorStateProps) {
  return (
    <Card className={`w-full h-full flex items-center justify-center p-4 bg-gray-900/95 ${className}`}>
      <div className="text-center space-y-4">
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-sm text-red-400 font-medium">Failed to load map</p>
        <p className="text-xs text-gray-400">{error}</p>
        {/* The retry button is only shown if the maximum number of retries has not been reached. */}
        {retryCount < 3 && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
          >
            Retry ({3 - retryCount} attempts left)
          </Button>
        )}
        {retryCount >= 3 && (
          <p className="text-xs text-gray-500">Maximum retry attempts reached</p>
        )}
      </div>
    </Card>
  );
}