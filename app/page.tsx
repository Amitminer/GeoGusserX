'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/lib/storage/store';
import { storageManager } from '@/lib/storage';
import { mapsManager } from '@/lib/maps';
import { logger } from '@/lib/logger';
import { PageLayout } from '@/components/ui/page-layout';
import { HeroSection } from '@/components/homepage/hero-section';
import { FeaturesSection } from '@/components/homepage/features-section';
import { CTASection } from '@/components/homepage/cta-section';
import { Footer } from '@/components/homepage/footer';
import { HomepageSkeleton } from '@/components/homepage/homepage-skeleton';

export default function HomePage() {
  const router = useRouter();
  const { restoreActiveGame } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the application
  useEffect(() => {
    const initialize = async () => {
      logger.startTimer('app-initialization');
      try {
        logger.info('Initializing GeoGusserX application', undefined, 'HomePage');

        // Initialize storage
        await storageManager.initialize();
        
        // Initialize Google Maps
        await mapsManager.initialize();
        
        // Try to restore active game session
        const gameRestored = await restoreActiveGame();
        if (gameRestored) {
          // If there's an active game, redirect to play page
          router.push('/play');
          return;
        }

        setIsInitialized(true);
        const totalDuration = logger.endTimer('app-initialization', 'Application initialized successfully');
        logger.perf('App initialization', totalDuration);
      } catch (error) {
        logger.endTimer('app-initialization');
        logger.error('Failed to initialize application', error, 'HomePage');
      }
    };

    initialize();
  }, [restoreActiveGame, router]);

  // Simulate loading time 
  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  // Show skeleton loading
  if (isLoading || !isInitialized) {
    return <HomepageSkeleton />;
  }

  return (
    <PageLayout>
      <div className="relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* CTA Section */}
        <CTASection />

        {/* Footer */}
        <Footer />
      </div>
    </PageLayout>
  );
}