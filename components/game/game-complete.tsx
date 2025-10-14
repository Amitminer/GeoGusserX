'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameState } from '@/lib/types';
import { formatDistance, formatScore } from '@/lib/utils';
import { Trophy, MapPin, Target, Clock, Home, RotateCcw, Share2 } from 'lucide-react';

/**
 * A component that is displayed when the game is complete. It shows the final score,
 * detailed game statistics, and provides options to share the results, start a new game,
 * or return to the main menu.
 *
 * @param gameState The final state of the game.
 * @param onBackToMenu A callback function to return to the main menu.
 */
function GameCompleteComponent({ gameState, onBackToMenu }: { gameState: GameState; onBackToMenu: () => void }) {
	const router = useRouter();

	/**
	 * `useMemo` is used here to calculate the game statistics only when the `gameState` changes.
	 * This is a performance optimization that prevents expensive calculations on every render.
	 */
	const gameStats = useMemo(() => {
		const completedRounds = gameState.rounds.filter(r => r.completed);

		const totalDistance = completedRounds.length > 0
			? completedRounds.reduce((sum, r) => sum + (r.distance || 0), 0)
			: 0;
		const averageDistance = completedRounds.length > 0 ? totalDistance / completedRounds.length : 0;

		const bestRound = completedRounds.length > 0
			? completedRounds.reduce((best, round) =>
				(round.score || 0) > (best.score || 0) ? round : best
			)
			: { id: 'N/A', score: 0, distance: 0, completed: false, actualLocation: { lat: 0, lng: 0 }, guessedLocation: null, timeSpent: 0 };

		const worstRound = completedRounds.length > 0
			? completedRounds.reduce((worst, round) =>
				(round.score || 0) < (worst.score || 0) ? round : worst
			)
			: { id: 'N/A', score: 0, distance: 0, completed: false, actualLocation: { lat: 0, lng: 0 }, guessedLocation: null, timeSpent: 0 };

		const gameTime = gameState.endTime ? gameState.endTime - gameState.startTime : 0;
		const gameTimeMinutes = Math.floor(gameTime / 60000);
		const gameTimeSeconds = Math.floor((gameTime % 60000) / 1000);

		const getOverallRating = (score: number, totalRounds: number) => {
			if (totalRounds === 0) return { rating: 'No Rounds', color: 'text-gray-500', emoji: '❓' };

			const averageScore = score / totalRounds;
			if (averageScore >= 4000) return { rating: 'Master', color: 'text-purple-500', emoji: '🏆' };
			if (averageScore >= 3000) return { rating: 'Expert', color: 'text-blue-500', emoji: '🌟' };
			if (averageScore >= 2000) return { rating: 'Advanced', color: 'text-green-500', emoji: '🎯' };
			if (averageScore >= 1000) return { rating: 'Intermediate', color: 'text-yellow-500', emoji: '👍' };
			return { rating: 'Beginner', color: 'text-orange-500', emoji: '🌱' };
		};

		const rating = getOverallRating(gameState.totalScore, completedRounds.length);

		return {
			completedRounds,
			totalDistance,
			averageDistance,
			bestRound,
			worstRound,
			gameTimeMinutes,
			gameTimeSeconds,
			rating
		};
	}, [gameState]);

	/**
	 * Handles the sharing of game results. It uses the Web Share API if available,
	 * and falls back to copying the results to the clipboard.
	 */
	const handleShare = useCallback(async () => {
		const shareText = `I just scored ${formatScore(gameState.totalScore)} points in GeoGusserX! 🌍\n\nMode: ${gameState.mode}\nRounds: ${gameStats.completedRounds.length}\nAverage Distance: ${formatDistance(gameStats.averageDistance)}\n\nCan you beat my score?`;

		if (navigator.share) {
			try {
				await navigator.share({
					title: 'GeoGusserX Results',
					text: shareText,
					url: window.location.origin
				});
			} catch {
				navigator.clipboard.writeText(shareText);
			}
		} else {
			navigator.clipboard.writeText(shareText);
		}
	}, [gameState.totalScore, gameState.mode, gameStats.completedRounds.length, gameStats.averageDistance]);

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="fixed inset-0 bg-gradient-to-br from-blue-50/95 via-white/90 to-purple-50/95 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto"
		>
			<motion.div
				initial={{ scale: 0.95, y: 20, opacity: 0 }}
				animate={{ scale: 1, y: 0, opacity: 1 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
				className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl max-w-5xl w-full min-h-[80vh] max-h-[90vh] my-4 overflow-y-auto"
			>
				{/* The header section of the game complete screen. */}
				<div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white p-4 sm:p-6 lg:p-8 text-center rounded-t-3xl">
					<div className="text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4">
						{gameStats.rating.emoji}
					</div>
					<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Game Complete!</h1>
					<p className="text-blue-100 text-sm sm:text-base lg:text-lg">
						You achieved <span className={`font-semibold ${gameStats.rating.color}`}>{gameStats.rating.rating}</span> level!
					</p>
				</div>

				<div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
					{/* The player's final score. */}
					<div className="text-center">
						<div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
							{formatScore(gameState.totalScore)}
						</div>
						<div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Total Score</div>
					</div>

					{/* A grid of cards displaying detailed game statistics. */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
						<Card className="border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
									<div className="p-1 sm:p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
										<Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
									</div>
									<span className="hidden sm:inline">Rounds Played</span>
									<span className="sm:hidden">Rounds</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200">{gameStats.completedRounds.length}</div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{gameState.mode} mode</div>
							</CardContent>
						</Card>

						<Card className="border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl hover:border-green-400 dark:hover:border-green-500 transition-all duration-300">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
									<div className="p-1 sm:p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
										<MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
									</div>
									<span className="hidden sm:inline">Avg Distance</span>
									<span className="sm:hidden">Distance</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200">{formatDistance(gameStats.averageDistance)}</div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">per guess</div>
							</CardContent>
						</Card>

						<Card className="border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl hover:border-yellow-400 dark:hover:border-yellow-500 transition-all duration-300">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
									<div className="p-1 sm:p-1.5 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
										<Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400" />
									</div>
									<span className="hidden sm:inline">Avg Score</span>
									<span className="sm:hidden">Score</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
									{gameStats.completedRounds.length > 0
										? formatScore(Math.round(gameState.totalScore / gameStats.completedRounds.length))
										: formatScore(0)
									}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">per round</div>
							</CardContent>
						</Card>

						<Card className="border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
									<div className="p-1 sm:p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
										<Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
									</div>
									<span className="hidden sm:inline">Game Time</span>
									<span className="sm:hidden">Time</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
									{gameStats.gameTimeMinutes}:{gameStats.gameTimeSeconds.toString().padStart(2, '0')}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">minutes</div>
							</CardContent>
						</Card>
					</div>

					{/* Cards for the best and worst rounds of the game. */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
						<Card className="border-2 border-green-200/50 dark:border-green-700/50 bg-green-50/60 dark:bg-green-900/20 backdrop-blur-sm rounded-2xl hover:border-green-400 dark:hover:border-green-500 transition-all duration-300">
							<CardHeader className="pb-3">
								<CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2 text-base sm:text-lg">
									<div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
										<Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
									</div>
									Best Round
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between text-sm sm:text-base">
										<span className="text-gray-600 dark:text-gray-400">Score:</span>
										<span className="font-bold text-green-600 dark:text-green-400">{formatScore(gameStats.bestRound.score || 0)}</span>
									</div>
									<div className="flex justify-between text-sm sm:text-base">
										<span className="text-gray-600 dark:text-gray-400">Distance:</span>
										<span className="font-bold text-gray-800 dark:text-gray-200">{formatDistance(gameStats.bestRound.distance || 0)}</span>
									</div>
									<div className="flex justify-between text-sm sm:text-base">
										<span className="text-gray-600 dark:text-gray-400">Round:</span>
										<span className="font-bold text-gray-800 dark:text-gray-200">{gameStats.bestRound.id}</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-2 border-red-200/50 dark:border-red-700/50 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl hover:border-red-400 dark:hover:border-red-500 transition-all duration-300">
							<CardHeader className="pb-3">
								<CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-base sm:text-lg">
									<div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-lg">
										<Target className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
									</div>
									Most Challenging
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between text-sm sm:text-base">
										<span className="text-gray-600 dark:text-gray-400">Score:</span>
										<span className="font-bold text-red-600 dark:text-red-400">{formatScore(gameStats.worstRound.score || 0)}</span>
									</div>
									<div className="flex justify-between text-sm sm:text-base">
										<span className="text-gray-600 dark:text-gray-400">Distance:</span>
										<span className="font-bold text-gray-800 dark:text-gray-200">{formatDistance(gameStats.worstRound.distance || 0)}</span>
									</div>
									<div className="flex justify-between text-sm sm:text-base">
										<span className="text-gray-600 dark:text-gray-400">Round:</span>
										<span className="font-bold text-gray-800 dark:text-gray-200">{gameStats.worstRound.id}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Action buttons for sharing, starting a new game, or returning to the menu. */}
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
						<Button
							onClick={handleShare}
							variant="outline"
							className="flex items-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl transition-all duration-200"
						>
							<Share2 className="w-4 h-4" />
							Share Results
						</Button>

						<Button
							onClick={() => router.push('/config')}
							className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
						>
							<RotateCcw className="w-4 h-4" />
							New Game
						</Button>

						<Button
							onClick={onBackToMenu}
							variant="outline"
							className="flex items-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl transition-all duration-200"
						>
							<Home className="w-4 h-4" />
							Back to Menu
						</Button>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}

/**
 * The `GameComplete` component is wrapped in `React.memo` to prevent unnecessary re-renders.
 * Since the game state is immutable, this component will only re-render if the `gameState` prop
 * itself changes, which is a significant performance optimization.
 */
export const GameComplete = React.memo(GameCompleteComponent);