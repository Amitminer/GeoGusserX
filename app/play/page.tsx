'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/lib/storage/store';
import { mapsManager } from '@/lib/maps';
import { storageManager } from '@/lib/storage';
import { logger } from '@/lib/logger';
import { StreetViewLocation, Location, GuessResult } from '@/lib/types';
import type { GeocodeResult } from '@/lib/maps/geocoding';

import { GameHeader } from '@/components/game/game-header';
import { StreetView } from '@/components/street-view';
import { GuessMap } from '@/components/guess-map';
import { RoundResults } from '@/components/results/round-results';
import { GameComplete } from '@/components/game/game-complete';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { PageLayout } from '@/components/ui/page-layout';
import { AlertCircle, Home } from 'lucide-react';
import Loading from '../loading';

type GameScreen = 'loading' | 'playing' | 'results' | 'complete' | 'no-game';

export default function PlayPage() {
	const router = useRouter();
	const {
		currentGame,
		isLoading,
		error,
		showResults,
		showGameComplete,
		countrySettings,
		makeGuess,
		nextRound,
		endGame,
		resetGame,
		setError,
		restoreActiveGame,
		cleanupStorage,
		setActualLocation
	} = useGameStore();

	const [screen, setScreen] = useState<GameScreen>('loading');
	const [currentLocation, setCurrentLocation] = useState<StreetViewLocation | null>(null);
	const [lastResult, setLastResult] = useState<GuessResult | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [countryInfo, setCountryInfo] = useState<GeocodeResult | null>(null);

	const [isGeneratingLocation, setIsGeneratingLocation] = useState(false);

	const initializationRef = useRef(false);

	// Initialize the application - only once
	useEffect(() => {
		if (initializationRef.current) return;
		initializationRef.current = true;

		const initialize = async () => {
			logger.startTimer('play-page-initialization');
			try {
				logger.info('Initializing play page', undefined, 'PlayPage');

				// Initialize storage and maps if not already done
				await storageManager.initialize();
				await mapsManager.initialize();

				// Try to restore active game session
				const gameRestored = await restoreActiveGame();

				if (!gameRestored) {
					// No active game, redirect to home to select game mode
					setScreen('no-game');
					setIsInitialized(true);
					return;
				}

				// Run periodic cleanup
				await cleanupStorage();

				setIsInitialized(true);
				const totalDuration = logger.endTimer('play-page-initialization', 'Play page initialized successfully');
				logger.perf('Play page initialization', totalDuration, { gameRestored });
			} catch (error) {
				logger.endTimer('play-page-initialization');
				logger.error('Failed to initialize play page', error, 'PlayPage');
				setError('Failed to initialize the game. Please try again.');
			}
		};

		initialize();
	}, [cleanupStorage, restoreActiveGame, setError]);

	// Handle game state changes 
	useEffect(() => {
		if (!currentGame) {
			setScreen('no-game');
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
	}, [currentGame, showGameComplete, showResults, isLoading, router]);



	// Memoize target country to prevent unnecessary re-renders
	const targetCountry = countrySettings.isRandomCountry ? undefined : countrySettings.targetCountry;

	// Memoize game actions to prevent unnecessary re-renders
	const memoizedEndGame = useCallback(() => {
		endGame();
	}, [endGame]);

	const memoizedNextRound = useCallback(() => {
		nextRound();
	}, [nextRound]);

	// Generate new location for current round - simplified and more reliable
	useEffect(() => {
		// Only generate if we have a game, we're on playing screen, and no location yet
		if (!currentGame || screen !== 'playing' || showGameComplete || currentLocation || isGeneratingLocation) {
			return;
		}

		const currentRoundIndex = currentGame.currentRoundIndex;
		const currentRound = currentGame.rounds[currentRoundIndex];

		if (!currentRound) {
			return;
		}

		// If current round is completed, we need to advance to next round or end game
		if (currentRound.completed) {
			// Check if this is the last round
			if (currentRoundIndex >= currentGame.rounds.length - 1 && currentGame.mode !== 'infinite') {
				queueMicrotask(() => memoizedEndGame());
				return;
			}

			// For infinite mode or if there are more rounds, advance to next round
			// Use queueMicrotask to avoid calling store action during render (more efficient than setTimeout)
			queueMicrotask(() => memoizedNextRound());
			return;
		}

		// If round already has a location, use it
		if (currentRound.actualLocation.lat !== 0 || currentRound.actualLocation.lng !== 0) {
			setCurrentLocation({
				location: currentRound.actualLocation,
				heading: Math.random() * 360,
				pitch: -10 + Math.random() * 20,
				zoom: 1
			});
			return;
		}

		// Generate new location
		const generateLocation = async () => {
			setIsGeneratingLocation(true);

			try {
				const streetViewLocation = await mapsManager.getRandomStreetViewLocation(targetCountry ?? undefined);

				// Debug logging for generated location
				logger.info('🌍 Generated Street View location', {
					streetViewLocation,
					roundId: currentRound.id,
					timestamp: Date.now()
				}, 'PlayPage');

				// IMPORTANT: Use the store method to properly update the actual location
				await setActualLocation(streetViewLocation.location);
				
				setCurrentLocation(streetViewLocation);
				
			} catch (error) {
				logger.error('Failed to generate Street View location', error, 'PlayPage');

				// Use fallback location
				const fallbackLocation = {
					location: { lat: 40.7580, lng: -73.9855 }, // Times Square
					heading: Math.random() * 360,
					pitch: 0,
					zoom: 1
				};
				
				// Use the store method to update with fallback location
				await setActualLocation(fallbackLocation.location);
				
				setCurrentLocation(fallbackLocation);
				
			} finally {
				setIsGeneratingLocation(false);
			}
		};

		generateLocation();
	}, [currentGame, screen, showGameComplete, currentLocation, isGeneratingLocation, targetCountry, memoizedEndGame, memoizedNextRound, setActualLocation]);

	const handleMakeGuess = async (guessedLocation: Location) => {
		if (!currentGame) return;

		// Debug logging to track guess processing
		logger.info('🎮 PlayPage received guess', {
			guessedLocation,
			currentRoundIndex: currentGame.currentRoundIndex,
			currentRound: currentGame.rounds[currentGame.currentRoundIndex],
			timestamp: Date.now()
		}, 'PlayPage');

		try {
			const result = await makeGuess(guessedLocation);
			
			// Debug logging for result
			logger.info('🏆 Guess result received', {
				result,
				timestamp: Date.now()
			}, 'PlayPage');
			
			setLastResult(result);
		} catch (error) {
			logger.error('Failed to process guess', error, 'PlayPage');
			setError('Failed to process your guess. Please try again.');
		}
	};

	const handleNextRound = () => {
		setLastResult(null);
		setCurrentLocation(null); // This will trigger location generation
		nextRound();
	};

	const handleEndGame = () => {
		endGame();
	};

	const handleBackToHome = useCallback(() => {
		// Clean up current state
		setLastResult(null);
		setCurrentLocation(null);

		resetGame();
		router.push('/');
	}, [resetGame, router]);

	// Handle Street View errors
	const handleStreetViewError = useCallback(async (errorMessage: string) => {
		logger.error('Street View error', { errorMessage }, 'PlayPage');
		setError('Street View failed to load. Please try refreshing the page.');
	}, [setError]);

	// Show loading screen while initializing
	if (!isInitialized) {
		return <Loading />;
	}

	// Show error screen
	if (error) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
				<div className="text-center max-w-md mx-auto p-6">
					<AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
					<h2 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h2>
					<p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
					<div className="space-x-4">
						<Button
							onClick={() => {
								setError(null);
								router.push('/');
							}}
							className="bg-red-500 hover:bg-red-600 text-white"
						>
							Go Home
						</Button>
						<Button
							variant="outline"
							onClick={() => window.location.reload()}
						>
							Retry
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<PageLayout background="game">
			{/* Results Screen */}
			{screen === 'results' && lastResult && currentGame && (
				<RoundResults
					key="results"
					result={lastResult}
					roundNumber={currentGame.currentRoundIndex + 1}
					onNextRound={handleNextRound}
					onEndGame={handleEndGame}
					isLastRound={currentGame.currentRoundIndex >= currentGame.rounds.length - 1 && currentGame.mode !== 'infinite'}
				/>
			)}

			{/* Game Complete Screen */}
			{screen === 'complete' && currentGame && (
				<GameComplete
					key="complete"
					gameState={currentGame}
					onBackToMenu={handleBackToHome}
				/>
			)}

			<AnimatePresence mode="wait">
				{screen === 'no-game' && (
					<PageTransition
						key="no-game"
						className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
					>
						<div className="text-center max-w-md mx-auto p-6">
							<Home className="w-16 h-16 text-blue-500 mx-auto mb-4" />
							<h2 className="text-2xl font-bold mb-4">No Active Game</h2>
							<p className="text-gray-600 dark:text-gray-300 mb-6">
								You don&apos;t have an active game. Please go back to the homepage to start a new game.
							</p>
							<Button
								onClick={() => router.push('/')}
								className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
							>
								Go to Homepage
							</Button>
						</div>
					</PageTransition>
				)}

				{screen === 'loading' && (
					<div key="loading">
						<Loading />
					</div>
				)}
				{screen === 'playing' && (
					currentGame && currentLocation ? (
						<motion.div
							key="playing"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="h-screen flex flex-col relative"
						>
							<GameHeader
								onEndGame={handleEndGame}
								currentLocation={currentLocation?.location || null}
								countryInfo={countryInfo}
							/>

							{/* Fullscreen Street View */}
							<div className="flex-1 relative">
								<StreetView
									location={currentLocation}
									onCountryInfoChange={setCountryInfo}
									onStreetViewError={handleStreetViewError}
								/>

								{/* Floating Guess Map - positioned in bottom right */}
								<GuessMap
									onGuess={handleMakeGuess}
									disabled={showResults}
								/>
							</div>
						</motion.div>
					) : (
						/* Show loading when game exists but location is loading */
						<div key="game-loading">
							<Loading />
						</div>
					)
				)}

			</AnimatePresence>
		</PageLayout>
	);
}
