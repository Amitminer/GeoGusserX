export interface Location {
	lat: number;
	lng: number;
}

export interface GameRound {
	id: string;
	actualLocation: Location;
	guessedLocation: Location | null;
	distance: number | null;
	score: number | null;
	timeSpent: number;
	completed: boolean;
}

export interface GameState {
	id: string;
	mode: GameMode;
	rounds: GameRound[];
	currentRoundIndex: number;
	totalScore: number;
	startTime: number;
	endTime: number | null;
	isCompleted: boolean;
}

export type GameMode = '4-rounds' | '5-rounds' | '8-rounds' | 'infinite';

export interface GameSettings {
	mode: GameMode;
	timeLimit?: number;
	difficulty?: 'easy' | 'medium' | 'hard';
}

export interface StreetViewLocation {
	location: Location;
	panoId?: string;
	heading?: number;
	pitch?: number;
	zoom?: number;
}

export interface GuessResult {
	distance: number;
	score: number;
	actualLocation: Location;
	guessedLocation: Location;
}

export interface GameStats {
	totalGames: number;
	totalScore: number;
	averageScore: number;
	bestScore: number;
	totalDistance: number;
	averageDistance: number;
	bestDistance: number;
	gamesPerMode: Record<GameMode, number>;
}

export interface ToastMessage {
	id: string;
	title: string;
	description?: string;
	type: 'success' | 'error' | 'warning' | 'info';
	duration?: number;
}
