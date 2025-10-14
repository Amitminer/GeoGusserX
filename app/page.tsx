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

/**
 * The main homepage for the application. This component is responsible for initializing
 * the necessary services (storage, maps), checking for an active game session, and
 * displaying the homepage content if no active game is found.
 */
export default function HomePage() {
  const router = useRouter();
  const { restoreActiveGame } = useGameStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * This effect runs on component mount to initialize the application. It sets up
   * the storage and map services, and then attempts to restore an active game session.
   * If a game is restored, it redirects the user to the play page.
   */
  useEffect(() => {
    const initialize = async () => {
      logger.startTimer('app-initialization');
      try {
        logger.info('Initializing GeoGusserX application', undefined, 'HomePage');

        await storageManager.initialize();
        await mapsManager.initialize();
        
        const gameRestored = await restoreActiveGame();
        if (gameRestored) {
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

  /**
   * This effect introduces a small, artificial delay to the loading process.
   * This prevents a jarring flash of content if the initialization is very fast,
   * leading to a smoother user experience.
   */
  useEffect(() => {
    if (isInitialized) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isInitialized]);

  // While the application is initializing, a skeleton loader is displayed.
  if (isLoading || !isInitialized) {
    return <HomepageSkeleton />;
  }

  return (
    <PageLayout>
      <div className="relative">
        {/* These divs create a subtle, decorative background effect. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <HeroSection />
        <FeaturesSection />
        <CTASection />
        <Footer />
      </div>
    </PageLayout>
  );
}