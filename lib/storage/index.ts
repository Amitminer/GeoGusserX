import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { GameState, GameStats } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Defines the schema for the IndexedDB database.
 * This includes the object stores for games, stats, and settings.
 */
interface GeoGusserXDB extends DBSchema {
	games: {
		key: string;
		value: GameState;
		indexes: { 'by-date': number };
	};
	stats: {
		key: string;
		value: GameStats & { id: string };
	};
	settings: {
		key: string;
		value: { key: string; value: unknown };
	};
}

/**
 * A singleton class that manages all interactions with IndexedDB.
 * It provides a simple and consistent API for saving, retrieving, and deleting
 * game state, statistics, and user settings.
 */
class StorageManager {
	private db: IDBPDatabase<GeoGusserXDB> | null = null;
	private readonly dbName = 'geogusserx-db';
	private readonly dbVersion = 1;

	/**
	 * Initializes the IndexedDB database. This method should be called before
	 * any other methods of the `StorageManager` are used.
	 */
	async initialize(): Promise<void> {
		logger.startTimer('storage-init');
		try {
			this.db = await openDB<GeoGusserXDB>(this.dbName, this.dbVersion, {
				upgrade(db) {
					const gamesStore = db.createObjectStore('games', { keyPath: 'id' });
					gamesStore.createIndex('by-date', 'startTime');

					db.createObjectStore('stats', { keyPath: 'id' });

					db.createObjectStore('settings', { keyPath: 'key' });
				},
			});
			const duration = logger.endTimer('storage-init', 'IndexedDB initialized successfully');
			logger.perf('Storage initialization', duration, { dbName: this.dbName, version: this.dbVersion });
		} catch (error) {
			logger.endTimer('storage-init');
			logger.error('Failed to initialize IndexedDB', error, 'StorageManager');
			throw error;
		}
	}

	/**
	 * A private helper method that ensures the database has been initialized.
	 * @returns The database instance.
	 */
	private ensureDB(): IDBPDatabase<GeoGusserXDB> {
		if (!this.db) {
			throw new Error('Database not initialized. Call initialize() first.');
		}
		return this.db;
	}

	/**
	 * Saves the current game state to the database.
	 * @param gameState The game state to be saved.
	 */
	async saveGameState(gameState: GameState): Promise<void> {
		logger.startTimer('save-game-state');
		try {
			const db = this.ensureDB();
			await db.put('games', gameState);
			const duration = logger.endTimer('save-game-state', 'Game state saved');
			logger.perf('Save game state', duration, { gameId: gameState.id, roundsCount: gameState.rounds.length });
		} catch (error) {
			logger.endTimer('save-game-state');
			logger.error('Failed to save game state', error, 'StorageManager');
			throw error;
		}
	}

	/**
	 * Retrieves a game state from the database by its ID.
	 * @param gameId The ID of the game to retrieve.
	 * @returns A promise that resolves with the `GameState` object, or null if not found.
	 */
	async getGameState(gameId: string): Promise<GameState | null> {
		logger.startTimer('get-game-state');
		try {
			const db = this.ensureDB();
			const gameState = await db.get('games', gameId);
			const duration = logger.endTimer('get-game-state');
			logger.perf('Get game state', duration, { gameId, found: !!gameState });
			return gameState || null;
		} catch (error) {
			logger.endTimer('get-game-state');
			logger.error('Failed to get game state', error, 'StorageManager');
			return null;
		}
	}

	/**
	 * Retrieves all game states from the database, sorted by start time.
	 * @returns A promise that resolves with an array of `GameState` objects.
	 */
	async getAllGames(): Promise<GameState[]> {
		logger.startTimer('get-all-games');
		try {
			const db = this.ensureDB();
			const games = await db.getAll('games');
			const sortedGames = games.sort((a, b) => b.startTime - a.startTime);
			const duration = logger.endTimer('get-all-games');
			logger.perf('Get all games', duration, { gamesCount: sortedGames.length });
			return sortedGames;
		} catch (error) {
			logger.endTimer('get-all-games');
			logger.error('Failed to get all games', error, 'StorageManager');
			return [];
		}
	}

	/**
	 * Deletes a game state from the database by its ID.
	 * @param gameId The ID of the game to delete.
	 */
	async deleteGame(gameId: string): Promise<void> {
		logger.startTimer('delete-game');
		try {
			const db = this.ensureDB();
			await db.delete('games', gameId);
			const duration = logger.endTimer('delete-game', 'Game deleted');
			logger.perf('Delete game', duration, { gameId });
		} catch (error) {
			logger.endTimer('delete-game');
			logger.error('Failed to delete game', error, 'StorageManager');
			throw error;
		}
	}

	/**
	 * Retrieves the global game statistics from the database.
	 * @returns A promise that resolves with the `GameStats` object, or null if not found.
	 */
	async getStats(): Promise<GameStats | null> {
		logger.startTimer('get-stats');
		try {
			const db = this.ensureDB();
			const stats = await db.get('stats', 'global');
			const duration = logger.endTimer('get-stats');
			logger.perf('Get stats', duration, { found: !!stats });
			return stats || null;
		} catch (error) {
			logger.endTimer('get-stats');
			logger.error('Failed to get stats', error, 'StorageManager');
			return null;
		}
	}

	/**
	 * Updates the global game statistics in the database.
	 * @param stats The new game statistics.
	 */
	async updateStats(stats: GameStats): Promise<void> {
		logger.startTimer('update-stats');
		try {
			const db = this.ensureDB();
			const statsWithId = { ...stats, id: 'global' };
			await db.put('stats', statsWithId);
			const duration = logger.endTimer('update-stats', 'Stats updated');
			logger.perf('Update stats', duration, {
				totalGames: stats.totalGames,
				averageScore: stats.averageScore
			});
		} catch (error) {
			logger.endTimer('update-stats');
			logger.error('Failed to update stats', error, 'StorageManager');
			throw error;
		}
	}

	/**
	 * Retrieves a setting from the database by its key.
	 * @param key The key of the setting to retrieve.
	 * @returns A promise that resolves with the value of the setting, or null if not found.
	 */
	async getSetting<T>(key: string): Promise<T | null> {
		try {
			const db = this.ensureDB();
			const setting = await db.get('settings', key);
			return (setting?.value as T) || null;
		} catch (error) {
			logger.error('Failed to get setting', { key, error }, 'StorageManager');
			return null;
		}
	}

	/**
	 * Saves a setting to the database.
	 * @param key The key of the setting to save.
	 * @param value The value of the setting.
	 */
	async setSetting<T>(key: string, value: T): Promise<void> {
		try {
			const db = this.ensureDB();
			await db.put('settings', { key, value });
			logger.info('Setting saved', { key }, 'StorageManager');
		} catch (error) {
			logger.error('Failed to save setting', { key, error }, 'StorageManager');
			throw error;
		}
	}

	/**
	 * Clears all data from the database.
	 */
	async clearAllData(): Promise<void> {
		try {
			const db = this.ensureDB();
			await db.clear('games');
			await db.clear('stats');
			await db.clear('settings');
			logger.info('All data cleared', undefined, 'StorageManager');
		} catch (error) {
			logger.error('Failed to clear data', error, 'StorageManager');
			throw error;
		}
	}

	/**
	 * Deletes old or completed games from the database to prevent storage bloat.
	 */
	async cleanupOldGames(): Promise<void> {
		logger.startTimer('cleanup-old-games');
		try {
			const db = this.ensureDB();
			const allGames = await db.getAll('games');
			
			const now = Date.now();
			const EXPIRY_TIME = 4 * 60 * 60 * 1000; // 4 hours
			
			let deletedCount = 0;
			
			for (const game of allGames) {
				const gameAge = now - game.startTime;
				
				if (game.isCompleted || gameAge > EXPIRY_TIME) {
					await db.delete('games', game.id);
					deletedCount++;
					logger.info('Deleted old/completed game', { gameId: game.id, isCompleted: game.isCompleted, ageHours: Math.round(gameAge / (60 * 60 * 1000)) }, 'StorageManager');
				}
			}
			
			const duration = logger.endTimer('cleanup-old-games', `Cleaned up ${deletedCount} old games`);
			logger.perf('Cleanup old games', duration, { totalGames: allGames.length, deletedCount });
			
		} catch (error) {
			logger.endTimer('cleanup-old-games');
			logger.error('Failed to cleanup old games', error, 'StorageManager');
		}
	}

	/**
	 * Retrieves the most recent active (incomplete) game from the database.
	 * @returns A promise that resolves with the active `GameState` object, or null if none is found.
	 */
	async getActiveGame(): Promise<GameState | null> {
		logger.startTimer('get-active-game');
		try {
			const db = this.ensureDB();
			const allGames = await db.getAll('games');
			
			const activeGames = allGames
				.filter(game => !game.isCompleted)
				.sort((a, b) => b.startTime - a.startTime);
			
			const activeGame = activeGames[0] || null;
			
			const duration = logger.endTimer('get-active-game');
			logger.perf('Get active game', duration, { found: !!activeGame, activeGamesCount: activeGames.length });
			
			return activeGame;
			
		} catch (error) {
			logger.endTimer('get-active-game');
			logger.error('Failed to get active game', error, 'StorageManager');
			return null;
		}
	}

	/**
	 * Deletes all incomplete games from the database. This is typically called when starting a new game.
	 */
	async cleanupIncompleteGames(): Promise<void> {
		logger.startTimer('cleanup-incomplete-games');
		try {
			const db = this.ensureDB();
			const allGames = await db.getAll('games');
			
			let deletedCount = 0;
			
			for (const game of allGames) {
				if (!game.isCompleted) {
					await db.delete('games', game.id);
					deletedCount++;
					logger.info('Deleted incomplete game', { gameId: game.id }, 'StorageManager');
				}
			}
			
			const duration = logger.endTimer('cleanup-incomplete-games', `Cleaned up ${deletedCount} incomplete games`);
			logger.perf('Cleanup incomplete games', duration, { deletedCount });
			
		} catch (error) {
			logger.endTimer('cleanup-incomplete-games');
			logger.error('Failed to cleanup incomplete games', error, 'StorageManager');
		}
	}

	/**
	 * Retrieves the current storage usage and quota from the browser.
	 * @returns A promise that resolves with an object containing the used and quota values.
	 */
	async getStorageUsage(): Promise<{ used: number; quota: number }> {
		try {
			if ('storage' in navigator && 'estimate' in navigator.storage) {
				const estimate = await navigator.storage.estimate();
				return {
					used: estimate.usage || 0,
					quota: estimate.quota || 0
				};
			}
			return { used: 0, quota: 0 };
		} catch (error) {
			logger.error('Failed to get storage usage', error, 'StorageManager');
			return { used: 0, quota: 0 };
		}
	}
}

/**
 * The singleton instance of the `StorageManager` class.
 */
export const storageManager = new StorageManager();