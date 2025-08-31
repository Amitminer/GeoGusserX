'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/store';
import { mapsManager } from '@/lib/maps';
import { storageManager } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { StreetViewLocation, Location, GuessResult, GameMode } from '@/lib/types';

import { MainMenu } from '@/components/main-menu';
import { GameHeader } from '@/components/game-header';
import { StreetView } from '@/components/street-view';
import { GuessMap } from '@/components/guess-map';
import { RoundResults } from '@/components/round-results';
import { GameComplete } from '@/components/game-complete';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';

type GameScreen = 'menu' | 'loading' | 'playing' | 'results' | 'complete';

export function Game() {
  const {
    currentGame,
    isLoading,
    error,
    showResults,
    showGameComplete,
    startNewGame,
    makeGuess,
    nextRound,
    endGame,
    resetGame,
    setError
  } = useGameStore();

  const [screen, setScreen] = useState<GameScreen>('menu');
  const [currentLocation, setCurrentLocation] = useState<StreetViewLocation | null>(null);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize the application
  useEffect(() => {
    const initialize = async () => {
      logger.startTimer('app-initialization');
      try {
        logger.info('Initializing GeoGusserX application', undefined, 'Game');
        
        // Initialize storage
        logger.startTimer('storage-init-component');
        await storageManager.initialize();
        logger.endTimer('storage-init-component', 'Storage initialized');
        
        // Initialize Google Maps
        logger.startTimer('maps-init-component');
        await mapsManager.initialize();
        logger.endTimer('maps-init-component', 'Maps initialized');
        
        setIsInitialized(true);
        const totalDuration = logger.endTimer('app-initialization', 'Application initialized successfully');
        logger.perf('App initialization', totalDuration);
      } catch (error) {
        logger.endTimer('app-initialization');
        logger.error('Failed to initialize application', error, 'Game');
        setError('Failed to initialize the application. Please refresh the page.');
      }
    };

    initialize();
  }, [setError]);

  // Handle game state changes
  useEffect(() => {
    if (!currentGame) {
      setScreen('menu');
      return;
    }

    if (showGameComplete) {
      setScreen('complete');
      return;
    }

    if (showResults) {
      setScreen('results');
      return;
    }

    if (isLoading) {
      setScreen('loading');
      return;
    }

    setScreen('playing');
  }, [currentGame, showGameComplete, showResults, isLoading]);

  // Generate new location for current round
  useEffect(() => {
    const generateLocation = async () => {
      if (!currentGame || screen !== 'playing') return;

      const currentRound = currentGame.rounds[currentGame.currentRoundIndex];
      if (!currentRound || currentRound.completed) return;

      // If round already has a location, use it
      if (currentRound.actualLocation.lat !== 0 || currentRound.actualLocation.lng !== 0) {
        logger.startTimer('location-setup');
        setCurrentLocation({
          location: currentRound.actualLocation,
          heading: Math.random() * 360,
          pitch: -10 + Math.random() * 20,
          zoom: 1
        });
        const duration = logger.endTimer('location-setup');
        logger.perf('Location setup (existing)', duration, { roundIndex: currentGame.currentRoundIndex });
        return;
      }

      try {
        logger.startTimer('round-location-generation');
        logger.info('Generating new Street View location', { 
          roundIndex: currentGame.currentRoundIndex 
        }, 'Game');

        const streetViewLocation = await mapsManager.getRandomStreetViewLocation();
        
        // Update the round with the actual location
        currentRound.actualLocation = streetViewLocation.location;
        
        setCurrentLocation(streetViewLocation);
        
        const duration = logger.endTimer('round-location-generation', 'Street View location generated');
        logger.perf('Round location generation', duration, { 
          roundIndex: currentGame.currentRoundIndex,
          location: streetViewLocation.location 
        });

      } catch (error) {
        logger.endTimer('round-location-generation');
        logger.error('Failed to generate Street View location', error, 'Game');
        setError('Failed to load a new location. Please try again.');
      }
    };

    generateLocation();
  }, [currentGame, screen, setError]);

  const handleStartGame = async (mode: GameMode) => {
    logger.startTimer('handle-start-game');
    try {
      setScreen('loading');
      await startNewGame(mode);
      const duration = logger.endTimer('handle-start-game');
      logger.perf('Handle start game', duration, { mode });
    } catch (error) {
      logger.endTimer('handle-start-game');
      logger.error('Failed to start game', error, 'Game');
      setError('Failed to start the game. Please try again.');
      setScreen('menu');
    }
  };

  const handleMakeGuess = async (guessedLocation: Location) => {
    if (!currentGame) return;

    logger.startTimer('handle-make-guess');
    try {
      const result = await makeGuess(guessedLocation);
      setLastResult(result);
      const duration = logger.endTimer('handle-make-guess', 'Guess processed successfully');
      logger.perf('Handle make guess', duration, { 
        distance: result.distance,
        score: result.score 
      });
    } catch (error) {
      logger.endTimer('handle-make-guess');
      logger.error('Failed to process guess', error, 'Game');
      setError('Failed to process your guess. Please try again.');
    }
  };

  const handleNextRound = () => {
    setLastResult(null);
    setCurrentLocation(null);
    nextRound();
  };

  const handleEndGame = () => {
    endGame();
  };

  const handleNewGame = () => {
    resetGame();
    setLastResult(null);
    setCurrentLocation(null);
    setScreen('menu');
  };

  const handleBackToMenu = () => {
    resetGame();
    setLastResult(null);
    setCurrentLocation(null);
    setScreen('menu');
  };

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-2xl font-bold mb-2">Loading GeoGusserX</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Initializing maps and preparing your adventure...
          </p>
        </div>
      </div>
    );
  }

  // Show error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setScreen('menu');
            }}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MainMenu onStartGame={handleStartGame} />
          </motion.div>
        )}

        {screen === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
          >
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-2xl font-bold mb-2">Preparing Your Game</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Finding the perfect locations around the world...
              </p>
            </div>
          </motion.div>
        )}

        {screen === 'playing' && currentGame && currentLocation && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex flex-col"
          >
            <GameHeader onEndGame={handleEndGame} />
            
            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Street View */}
              <div className="flex-1 lg:flex-[2]">
                <StreetView location={currentLocation} />
              </div>
              
              {/* Guess Map */}
              <div className="h-64 lg:h-auto lg:flex-1">
                <GuessMap
                  onGuess={handleMakeGuess}
                  disabled={showResults}
                />
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'results' && lastResult && currentGame && (
          <RoundResults
            key="results"
            result={lastResult}
            roundNumber={currentGame.currentRoundIndex + 1}
            onNextRound={handleNextRound}
            isLastRound={currentGame.currentRoundIndex >= currentGame.rounds.length - 1 && currentGame.mode !== 'infinite'}
          />
        )}

        {screen === 'complete' && currentGame && (
          <GameComplete
            key="complete"
            gameState={currentGame}
            onNewGame={handleNewGame}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}