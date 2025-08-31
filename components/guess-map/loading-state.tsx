'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className }: LoadingStateProps) {
  return (
    <Card className={`w-full h-full flex flex-col shadow-2xl border-0 bg-gray-900/95 backdrop-blur-sm ${className}`}>
      {/* Skeleton Header */}
      <div className="flex items-center justify-between px-3 py-1.5 md:py-2 border-b bg-gray-800/90 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="h-3 w-3 md:h-4 md:w-4 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-3 w-20 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5">
          <div className="h-5 w-16 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-5 w-5 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Skeleton Map Area */}
      <div className="flex-1 flex items-center justify-center bg-gray-800 animate-pulse">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-gray-400">Loading map...</p>
        </div>
      </div>
    </Card>
  );
}