import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { GameState, GameStats } from '@/lib/types';
import { logger } from '@/lib/logger';

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

class StorageManager {
	private db: IDBPDatabase<GeoGusserXDB> | null = null;
	private readonly dbName = 'geogusserx-db';
	private readonly dbVersion = 1;

	async initialize(): Promise<void> {
		logger.startTimer('storage-init');
		try {
			this.db = await openDB<GeoGusserXDB>(this.dbName, this.dbVersion, {
				upgrade(db) {
					// Games store
					const gamesStore = db.createObjectStore('games', { keyPath: 'id' });
					gamesStore.createIndex('by-date', 'startTime');

					// Stats store
					db.createObjectStore('stats', { keyPath: 'id' });

					// Settings store
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

	private ensureDB(): IDBPDatabase<GeoGusserXDB> {
		if (!this.db) {
			throw new Error('Database not initialized. Call initialize() first.');
		}
		return this.db;
	}

	// Game State Management
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

	// Stats Management
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

	async updateStats(stats: GameStats): Promise<void> {
		logger.startTimer('update-stats');
		try {
			const db = this.ensureDB();
			// Create a stats object with id for storage
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

	// Settings Management
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

	// Cleanup
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

export const storageManager = new StorageManager();
