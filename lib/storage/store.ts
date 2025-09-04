import { create } from 'zustand';
import { GameState, GameRound, GameMode, Location, GuessResult, ToastMessage, CountrySettings, UserGameSettings } from '@/lib/types';
import { calculateDistance, calculateScore } from '@/lib/utils';
import { storageManager } from '.';
import { logger } from '@/lib/logger';

interface GameStore {
	// Game State
	currentGame: GameState | null;
	isLoading: boolean;
	error: string | null;

	// UI State
	isStreetViewLoaded: boolean;
	isMapLoaded: boolean;
	showResults: boolean;
	showGameComplete: boolean;

	// Settings
	countrySettings: CountrySettings;
	gameSettings: UserGameSettings;

	// Toast System
	toasts: ToastMessage[];

	// Actions
	startNewGame: (mode: GameMode) => Promise<void>;
	makeGuess: (guessedLocation: Location) => Promise<GuessResult>;
	nextRound: () => void;
	endGame: () => void;
	resetGame: () => void;
	restoreActiveGame: () => Promise<boolean>;
	cleanupStorage: () => Promise<void>;


	// UI Actions
	setStreetViewLoaded: (loaded: boolean) => void;
	setMapLoaded: (loaded: boolean) => void;
	setShowResults: (show: boolean) => void;
	setShowGameComplete: (show: boolean) => void;
	setError: (error: string | null) => void;

	// Toast Actions
	addToast: (toast: Omit<ToastMessage, 'id'>) => void;
	removeToast: (id: string) => void;

	// Storage Actions
	saveGame: () => Promise<void>;
	loadGame: (gameId: string) => Promise<void>;
	updateStats: () => Promise<void>;

	// Settings Actions
	updateCountrySettings: (settings: CountrySettings) => Promise<void>;
	loadCountrySettings: () => Promise<void>;
	updateGameSettings: (settings: UserGameSettings) => Promise<void>;
	loadGameSettings: () => Promise<void>;

	// Hint Actions
	purchaseHint: (cost: number) => Promise<boolean>;
}

export const useGameStore = create<GameStore>((set, get) => ({
	// Initial State
	currentGame: null,
	isLoading: false,
	error: null,
	isStreetViewLoaded: false,
	isMapLoaded: false,
	showResults: false,
	showGameComplete: false,
	countrySettings: {
		isRandomCountry: true,
		targetCountry: null
	},
	gameSettings: {
		showCountryName: false, // Default to false as requested
		preferredGameMode: '4-rounds' // Default to Quick Game for new users
	},
	toasts: [],

	// Game Actions
	startNewGame: async (mode: GameMode) => {
		logger.startTimer('start-new-game');
		set({ isLoading: true, error: null });

		try {
			// Clean up any incomplete games before starting new one
			await storageManager.cleanupIncompleteGames();

			// Also run general cleanup to remove old/completed games
			await storageManager.cleanupOldGames();

			const roundCount = mode === 'infinite' ? 1 : parseInt(mode.split('-')[0]);
			const gameId = `game-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

			const newGame: GameState = {
				id: gameId,
				mode,
				rounds: [],
				currentRoundIndex: 0,
				totalScore: 0,
				startTime: Date.now(),
				endTime: null,
				isCompleted: false
			};

			// Initialize rounds
			for (let i = 0; i < roundCount; i++) {
				const round: GameRound = {
					id: `round-${i + 1}`,
					actualLocation: { lat: 0, lng: 0 }, // Will be set when round starts
					guessedLocation: null,
					distance: null,
					score: null,
					timeSpent: 0,
					completed: false
				};
				newGame.rounds.push(round);
			}

			set({
				currentGame: newGame,
				isLoading: false,
				showResults: false,
				showGameComplete: false
			});

			await get().saveGame();

			const duration = logger.endTimer('start-new-game', 'New game started');
			logger.perf('Start new game', duration, { gameId, mode, roundCount });

			get().addToast({
				title: 'Game Started!',
				description: `Playing ${mode} mode`,
				type: 'success'
			});

		} catch (error) {
			logger.endTimer('start-new-game');
			logger.error('Failed to start new game', error, 'GameStore');
			set({
				error: 'Failed to start new game',
				isLoading: false
			});

			get().addToast({
				title: 'Error',
				description: 'Failed to start new game',
				type: 'error'
			});
		}
	},

	makeGuess: async (guessedLocation: Location): Promise<GuessResult> => {
		logger.startTimer('make-guess');
		const { currentGame } = get();

		if (!currentGame) {
			throw new Error('No active game');
		}

		const currentRound = currentGame.rounds[currentGame.currentRoundIndex];
		if (!currentRound || currentRound.completed) {
			throw new Error('No active round');
		}

		try {
			logger.startTimer('calculate-distance');
			const distance = calculateDistance(
				currentRound.actualLocation.lat,
				currentRound.actualLocation.lng,
				guessedLocation.lat,
				guessedLocation.lng
			);
			const distanceCalcDuration = logger.endTimer('calculate-distance');

			logger.startTimer('calculate-score');
			const score = calculateScore(distance);
			const scoreCalcDuration = logger.endTimer('calculate-score');

			// Update round
			currentRound.guessedLocation = guessedLocation;
			currentRound.distance = distance;
			currentRound.score = score;
			currentRound.completed = true;

			// Update total score
			currentGame.totalScore += score;

			const result: GuessResult = {
				distance,
				score,
				actualLocation: currentRound.actualLocation,
				guessedLocation
			};

			// Batch all state updates into a single set call to prevent multiple re-renders
			set({
				currentGame: { ...currentGame },
				showResults: true
			});

			await get().saveGame();

			const totalDuration = logger.endTimer('make-guess', 'Guess made');
			logger.perf('Make guess', totalDuration, {
				distance,
				score,
				roundId: currentRound.id,
				distanceCalcTime: distanceCalcDuration,
				scoreCalcTime: scoreCalcDuration
			});

			return result;

		} catch (error) {
			logger.endTimer('make-guess');
			logger.error('Failed to make guess', error, 'GameStore');
			throw error;
		}
	},

	nextRound: () => {
		const { currentGame } = get();

		if (!currentGame) return;

		const nextIndex = currentGame.currentRoundIndex + 1;

		if (currentGame.mode === 'infinite') {
			// Add new round for infinite mode
			const newRound: GameRound = {
				id: `round-${nextIndex + 1}`,
				actualLocation: { lat: 0, lng: 0 },
				guessedLocation: null,
				distance: null,
				score: null,
				timeSpent: 0,
				completed: false
			};
			currentGame.rounds.push(newRound);
		}

		if (nextIndex >= currentGame.rounds.length) {
			// Game completed
			get().endGame();
			return;
		}

		currentGame.currentRoundIndex = nextIndex;

		set({
			currentGame: { ...currentGame },
			showResults: false
		});

		get().saveGame();

		logger.info('Advanced to next round', {
			roundIndex: nextIndex
		}, 'GameStore');
	},

	endGame: () => {
		const { currentGame } = get();

		if (!currentGame) return;

		currentGame.endTime = Date.now();
		currentGame.isCompleted = true;

		set({
			currentGame: { ...currentGame },
			showGameComplete: true,
			showResults: false
		});

		get().saveGame();
		get().updateStats();

		logger.info('Game ended', {
			gameId: currentGame.id,
			totalScore: currentGame.totalScore
		}, 'GameStore');

		get().addToast({
			title: 'Game Complete!',
			description: `Final score: ${currentGame.totalScore.toLocaleString()}`,
			type: 'success'
		});
	},

	resetGame: () => {
		set({
			currentGame: null,
			showResults: false,
			showGameComplete: false,
			error: null
		});

		logger.info('Game reset', undefined, 'GameStore');
	},

	// Session restoration
	restoreActiveGame: async (): Promise<boolean> => {
		logger.startTimer('restore-active-game');
		set({ isLoading: true, error: null });

		try {
			// First, clean up old games
			await storageManager.cleanupOldGames();

			// Try to find an active game
			const activeGame = await storageManager.getActiveGame();

			if (activeGame) {
				// Restore the game state
				set({
					currentGame: activeGame,
					isLoading: false,
					showResults: false,
					showGameComplete: false
				});

				const duration = logger.endTimer('restore-active-game', 'Active game restored');
				logger.perf('Restore active game', duration, {
					gameId: activeGame.id,
					mode: activeGame.mode,
					roundIndex: activeGame.currentRoundIndex
				});

				get().addToast({
					title: '🎮 Game Restored!',
					description: `Continuing your ${activeGame.mode} game (Round ${activeGame.currentRoundIndex + 1})`,
					type: 'success',
					duration: 3000 // Show for 3 seconds
				});

				return true;
			} else {
				// No active game found
				set({ isLoading: false });
				logger.endTimer('restore-active-game', 'No active game found');
				return false;
			}

		} catch (error) {
			logger.endTimer('restore-active-game');
			logger.error('Failed to restore active game', error, 'GameStore');
			set({
				error: 'Failed to restore previous game session',
				isLoading: false
			});
			return false;
		}
	},

	// Storage cleanup
	cleanupStorage: async () => {
		logger.startTimer('cleanup-storage');
		try {
			await storageManager.cleanupOldGames();
			const duration = logger.endTimer('cleanup-storage', 'Storage cleanup completed');
			logger.perf('Storage cleanup', duration);
		} catch (error) {
			logger.endTimer('cleanup-storage');
			logger.error('Failed to cleanup storage', error, 'GameStore');
		}
	},

	// UI Actions
	setStreetViewLoaded: (loaded: boolean) => {
		set({ isStreetViewLoaded: loaded });
	},

	setMapLoaded: (loaded: boolean) => {
		set({ isMapLoaded: loaded });
	},

	setShowResults: (show: boolean) => {
		set({ showResults: show });
	},

	setShowGameComplete: (show: boolean) => {
		set({ showGameComplete: show });
	},

	setError: (error: string | null) => {
		set({ error });
	},

	// Toast Actions
	addToast: (toast: Omit<ToastMessage, 'id'>) => {
		const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
		const newToast: ToastMessage = { ...toast, id };

		set(state => ({
			toasts: [...state.toasts, newToast]
		}));

		// Auto remove after duration
		const duration = toast.duration || 3000;
		setTimeout(() => {
			get().removeToast(id);
		}, duration);
	},

	removeToast: (id: string) => {
		set(state => ({
			toasts: state.toasts.filter(toast => toast.id !== id)
		}));
	},

	// Storage Actions
	saveGame: async () => {
		const { currentGame } = get();

		if (!currentGame) return;

		try {
			await storageManager.saveGameState(currentGame);
		} catch (error) {
			logger.error('Failed to save game', error, 'GameStore');
		}
	},

	loadGame: async (gameId: string) => {
		set({ isLoading: true });

		try {
			const gameState = await storageManager.getGameState(gameId);

			if (gameState) {
				set({
					currentGame: gameState,
					isLoading: false,
					showResults: false,
					showGameComplete: gameState.isCompleted
				});

				logger.info('Game loaded', { gameId }, 'GameStore');
			} else {
				throw new Error('Game not found');
			}
		} catch (error) {
			logger.error('Failed to load game', error, 'GameStore');
			set({
				error: 'Failed to load game',
				isLoading: false
			});
		}
	},

	// Stats update helper
	updateStats: async () => {
		logger.startTimer('update-game-stats');
		const { currentGame } = get();

		if (!currentGame || !currentGame.isCompleted) return;

		try {
			let stats = await storageManager.getStats();

			if (!stats) {
				stats = {
					totalGames: 0,
					totalScore: 0,
					averageScore: 0,
					bestScore: 0,
					totalDistance: 0,
					averageDistance: 0,
					bestDistance: Infinity,
					gamesPerMode: {
						'4-rounds': 0,
						'5-rounds': 0,
						'8-rounds': 0,
						'infinite': 0
					}
				};
			}

			// Update stats
			stats.totalGames++;
			stats.totalScore += currentGame.totalScore;
			stats.averageScore = stats.totalScore / stats.totalGames;
			stats.bestScore = Math.max(stats.bestScore, currentGame.totalScore);
			stats.gamesPerMode[currentGame.mode]++;

			// Calculate distance stats
			const completedRounds = currentGame.rounds.filter(r => r.completed && r.distance !== null);

			if (completedRounds.length > 0) {
				const totalRoundDistance = completedRounds.reduce((sum, r) => sum + (r.distance || 0), 0);
				stats.totalDistance += totalRoundDistance;

				// Calculate average distance per round across all games
				const totalRoundsPlayed = stats.totalGames > 1
					? (stats.totalGames - 1) * completedRounds.length + completedRounds.length
					: completedRounds.length;
				stats.averageDistance = stats.totalDistance / totalRoundsPlayed;

				// Find best distance from this game
				const distances = completedRounds.map(r => r.distance || Infinity).filter(d => d !== Infinity);
				if (distances.length > 0) {
					const bestRoundDistance = Math.min(...distances);
					if (bestRoundDistance < stats.bestDistance) {
						stats.bestDistance = bestRoundDistance;
					}
				}
			} else {
				// No completed rounds, don't update distance stats
				logger.warn('No completed rounds found for stats update', { gameId: currentGame.id }, 'GameStore');
			}

			await storageManager.updateStats(stats);

			const duration = logger.endTimer('update-game-stats', 'Stats updated');
			logger.perf('Update game stats', duration, {
				totalGames: stats.totalGames,
				gameScore: currentGame.totalScore,
				completedRoundsCount: completedRounds.length
			});

		} catch (error) {
			logger.endTimer('update-game-stats');
			logger.error('Failed to update stats', error, 'GameStore');
		}
	},

	// Settings Actions
	updateCountrySettings: async (settings: CountrySettings) => {
		try {
			await storageManager.setSetting('countrySettings', settings);
			set({ countrySettings: settings });
			logger.info('Country settings updated', settings, 'GameStore');
		} catch (error) {
			logger.error('Failed to update country settings', error, 'GameStore');
		}
	},

	loadCountrySettings: async () => {
		try {
			const settings = await storageManager.getSetting<CountrySettings>('countrySettings');
			if (settings) {
				set({ countrySettings: settings });
				logger.info('Country settings loaded', settings, 'GameStore');
			}
		} catch (error) {
			logger.error('Failed to load country settings', error, 'GameStore');
		}
	},

	updateGameSettings: async (settings: UserGameSettings) => {
		try {
			await storageManager.setSetting('gameSettings', settings);
			set({ gameSettings: settings });
			logger.info('Game settings updated', settings, 'GameStore');
		} catch (error) {
			logger.error('Failed to update game settings', error, 'GameStore');
		}
	},

	loadGameSettings: async () => {
		try {
			const settings = await storageManager.getSetting<UserGameSettings>('gameSettings');
			if (settings) {
				set({ gameSettings: settings });
				logger.info('Game settings loaded', settings, 'GameStore');
			}
		} catch (error) {
			logger.error('Failed to load game settings', error, 'GameStore');
		}
	},

	// Hint Actions
	purchaseHint: async (cost: number): Promise<boolean> => {
		const { currentGame } = get();
		
		if (!currentGame) {
			logger.error('No active game for hint purchase', undefined, 'GameStore');
			return false;
		}
		
		if (currentGame.totalScore < cost) {
			logger.warn('Insufficient score for hint purchase', {
				currentScore: currentGame.totalScore,
				requiredCost: cost
			}, 'GameStore');
			return false;
		}
		
		try {
			// Deduct the cost from total score
			currentGame.totalScore = Math.max(0, currentGame.totalScore - cost);
			
			// Update the state
			set({ currentGame: { ...currentGame } });
			
			// Save the game
			await get().saveGame();
			
			logger.info('Hint purchased successfully', {
				cost,
				remainingScore: currentGame.totalScore
			}, 'GameStore');
			
			return true;
		} catch (error) {
			logger.error('Failed to purchase hint', error, 'GameStore');
			return false;
		}
	}
}));

// Load settings on store creation
if (typeof window !== 'undefined') {
	storageManager.initialize().then(() => {
		const store = useGameStore.getState();
		store.loadCountrySettings();
		store.loadGameSettings();
	});
}
