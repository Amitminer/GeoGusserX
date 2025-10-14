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

/**
 * Defines the different screens that can be displayed on the play page,
 * representing the various states of the game.
 */
type GameScreen = 'loading' | 'playing' | 'results' | 'complete' | 'no-game';

/**
 * The main component for the game play page. It orchestrates the entire game flow,
 * from initialization and location generation to handling user guesses and displaying results.
 * It acts as a state machine, transitioning between different screens based on the game state.
 */
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
		skipRound,
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

	/**
	 * This effect runs only once on component mount to initialize the application.
	 * It ensures that all necessary services are ready and attempts to restore an active game.
	 */
	useEffect(() => {
		if (initializationRef.current) return;
		initializationRef.current = true;

		const initialize = async () => {
			logger.startTimer('play-page-initialization');
			try {
				logger.info('Initializing play page', undefined, 'PlayPage');

				await storageManager.initialize();
				await mapsManager.initialize();

				const gameRestored = await restoreActiveGame();

				if (!gameRestored) {
					setScreen('no-game');
					setIsInitialized(true);
					return;
				}

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

	/**
	 * This effect acts as a state machine, reacting to changes in the global game state
	 * from the `useGameStore` and setting the appropriate screen to be displayed.
	 */
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

	const targetCountry = countrySettings.isRandomCountry ? undefined : countrySettings.targetCountry;

	const memoizedEndGame = useCallback(() => {
		endGame();
	}, [endGame]);

	const memoizedNextRound = useCallback(() => {
		nextRound();
	}, [nextRound]);

	/**
	 * This effect is responsible for generating a new Street View location for the current round.
	 * It contains logic to ensure that a location is only generated when needed, and it handles
	 * both new location generation and loading existing locations for a round.
	 */
	useEffect(() => {
		if (!currentGame || screen !== 'playing' || showGameComplete || currentLocation || isGeneratingLocation) {
			return;
		}

		const currentRoundIndex = currentGame.currentRoundIndex;
		const currentRound = currentGame.rounds[currentRoundIndex];

		if (!currentRound) return;

		if (currentRound.completed) {
			if (currentRoundIndex >= currentGame.rounds.length - 1 && currentGame.mode !== 'infinite') {
				queueMicrotask(() => memoizedEndGame());
				return;
			}
			queueMicrotask(() => memoizedNextRound());
			return;
		}

		if (currentRound.actualLocation.lat !== 0 || currentRound.actualLocation.lng !== 0) {
			setCurrentLocation({
				location: currentRound.actualLocation,
				heading: Math.random() * 360,
				pitch: -10 + Math.random() * 20,
				zoom: 1
			});
			return;
		}

		const generateLocation = async () => {
			setIsGeneratingLocation(true);
			try {
				const streetViewLocation = await mapsManager.getRandomStreetViewLocation(targetCountry ?? undefined);
				logger.info('🌍 Generated Street View location', { streetViewLocation, roundId: currentRound.id, timestamp: Date.now() }, 'PlayPage');
				await setActualLocation(streetViewLocation.location);
				setCurrentLocation(streetViewLocation);
			} catch (error) {
				logger.error('Failed to generate Street View location', error, 'PlayPage');
				const fallbackLocation = {
					location: { lat: 40.7580, lng: -73.9855 }, // Times Square
					heading: Math.random() * 360,
					pitch: 0,
					zoom: 1
				};
				await setActualLocation(fallbackLocation.location);
				setCurrentLocation(fallbackLocation);
			} finally {
				setIsGeneratingLocation(false);
			}
		};

		generateLocation();
	}, [currentGame, screen, showGameComplete, currentLocation, isGeneratingLocation, targetCountry, memoizedEndGame, memoizedNextRound, setActualLocation]);

	/**
	 * Handles the user's guess by calling the `makeGuess` action from the game store.
	 * @param guessedLocation The location that the user guessed.
	 */
	const handleMakeGuess = async (guessedLocation: Location) => {
		if (!currentGame) return;

		logger.info('🎮 PlayPage received guess', { guessedLocation, currentRoundIndex: currentGame.currentRoundIndex, currentRound: currentGame.rounds[currentGame.currentRoundIndex], timestamp: Date.now() }, 'PlayPage');

		try {
			const result = await makeGuess(guessedLocation);
			logger.info('🏆 Guess result received', { result, timestamp: Date.now() }, 'PlayPage');
			setLastResult(result);
		} catch (error) {
			logger.error('Failed to process guess', error, 'PlayPage');
			setError('Failed to process your guess. Please try again.');
		}
	};

	/**
	 * Advances the game to the next round.
	 */
	const handleNextRound = () => {
		setLastResult(null);
		setCurrentLocation(null);
		nextRound();
	};

	/**
	 * Skips the current round.
	 */
	const handleSkipRound = () => {
		setCurrentLocation(null);
		skipRound();
	};

	/**
	 * Ends the current game.
	 */
	const handleEndGame = () => {
		endGame();
	};

	/**
	 * Resets the game state and returns the user to the homepage.
	 */
	const handleBackToHome = useCallback(() => {
		setLastResult(null);
		setCurrentLocation(null);
		resetGame();
		router.push('/');
	}, [resetGame, router]);

	/**
	 * Handles errors that occur within the `StreetView` component.
	 * @param errorMessage The error message from the `StreetView` component.
	 */
	const handleStreetViewError = useCallback(async (errorMessage: string) => {
		logger.error('Street View error', { errorMessage }, 'PlayPage');
		setError('Street View failed to load. Please try refreshing the page.');
	}, [setError]);

	if (!isInitialized) {
		return <Loading />;
	}

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
			{/* The results screen is displayed after a guess has been made. */}
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

			{/* The game complete screen is shown when all rounds have been played. */}
			{screen === 'complete' && currentGame && (
				<GameComplete
					key="complete"
					gameState={currentGame}
					onBackToMenu={handleBackToHome}
				/>
			)}

			<AnimatePresence mode="wait">
				{/* This screen is shown if there is no active game session. */}
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

				{/* The main game play screen, which includes the Street View and the guess map. */}
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
								onSkipRound={handleSkipRound}
								currentLocation={currentLocation?.location || null}
								countryInfo={countryInfo}
							/>

							<div className="flex-1 relative">
								<StreetView
									location={currentLocation}
									onCountryInfoChange={setCountryInfo}
									onStreetViewError={handleStreetViewError}
									onSkipRound={handleSkipRound}
								/>

								<GuessMap
									onGuess={handleMakeGuess}
									disabled={showResults}
								/>
							</div>
						</motion.div>
					) : (
						<div key="game-loading">
							<Loading />
						</div>
					)
				)}

			</AnimatePresence>
		</PageLayout>
	);
}