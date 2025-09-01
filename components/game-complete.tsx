'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameState } from '@/lib/types';
import { formatDistance, formatScore } from '@/lib/utils';
import { Trophy, MapPin, Target, Clock, Home, RotateCcw, Share2 } from 'lucide-react';

interface GameCompleteProps {
	gameState: GameState;
	onNewGame: () => void;
	onBackToMenu: () => void;
}

export function GameComplete({ gameState, onNewGame, onBackToMenu }: GameCompleteProps) {
	const completedRounds = gameState.rounds.filter(r => r.completed);
	
	// Safely calculate stats with fallbacks for empty arrays
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

	const handleShare = async () => {
		const shareText = `I just scored ${formatScore(gameState.totalScore)} points in GeoGusserX! 🌍\n\nMode: ${gameState.mode}\nRounds: ${completedRounds.length}\nAverage Distance: ${formatDistance(averageDistance)}\n\nCan you beat my score?`;

		// TODO: Implement share functionality right now does nothing
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'GeoGusserX Results',
					text: shareText,
					url: window.location.origin
				});
			} catch {
				// Fallback to clipboard
				navigator.clipboard.writeText(shareText);
			}
		} else {
			// Fallback to clipboard
			navigator.clipboard.writeText(shareText);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-start justify-center p-4 z-50 overflow-y-auto"
		>
			<motion.div
				initial={{ scale: 0.9, y: 20 }}
				animate={{ scale: 1, y: 0 }}
				className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full my-4 min-h-fit"
			>
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 md:p-8 text-center rounded-t-2xl">
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: 'spring' }}
						className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4"
					>
						{rating.emoji}
					</motion.div>
					<h1 className="text-2xl sm:text-3xl font-bold mb-2">Game Complete!</h1>
					<p className="text-blue-100 text-base sm:text-lg">
						You achieved <span className={rating.color}>{rating.rating}</span> level!
					</p>
				</div>

				<div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
					{/* Overall Stats */}
					<div className="text-center">
						<div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
							{formatScore(gameState.totalScore)}
						</div>
						<div className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Total Score</div>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
						<Card className="border border-gray-200 dark:border-gray-700">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
									<Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
									<span className="hidden sm:inline">Rounds Played</span>
									<span className="sm:hidden">Rounds</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-lg sm:text-2xl font-bold">{completedRounds.length}</div>
								<div className="text-xs text-gray-500 mt-1">{gameState.mode} mode</div>
							</CardContent>
						</Card>

						<Card className="border border-gray-200 dark:border-gray-700">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
									<MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
									<span className="hidden sm:inline">Avg Distance</span>
									<span className="sm:hidden">Distance</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-lg sm:text-2xl font-bold">{formatDistance(averageDistance)}</div>
								<div className="text-xs text-gray-500 mt-1">per guess</div>
							</CardContent>
						</Card>

						<Card className="border border-gray-200 dark:border-gray-700">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
									<Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
									<span className="hidden sm:inline">Avg Score</span>
									<span className="sm:hidden">Score</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-lg sm:text-2xl font-bold">
									{completedRounds.length > 0 
										? formatScore(Math.round(gameState.totalScore / completedRounds.length))
										: formatScore(0)
									}
								</div>
								<div className="text-xs text-gray-500 mt-1">per round</div>
							</CardContent>
						</Card>

						<Card className="border border-gray-200 dark:border-gray-700">
							<CardHeader className="pb-2">
								<CardTitle className="text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
									<Clock className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
									<span className="hidden sm:inline">Game Time</span>
									<span className="sm:hidden">Time</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-lg sm:text-2xl font-bold">
									{gameTimeMinutes}:{gameTimeSeconds.toString().padStart(2, '0')}
								</div>
								<div className="text-xs text-gray-500 mt-1">minutes</div>
							</CardContent>
						</Card>
					</div>

					{/* Best and Worst Rounds */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
						<Card className="border-green-200 dark:border-green-800">
							<CardHeader className="pb-3">
								<CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2 text-base sm:text-lg">
									<Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
									Best Round
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between text-sm sm:text-base">
										<span>Score:</span>
										<span className="font-bold text-green-600">{formatScore(bestRound.score || 0)}</span>
									</div>
									<div className="flex justify-between text-sm sm:text-base">
										<span>Distance:</span>
										<span className="font-bold">{formatDistance(bestRound.distance || 0)}</span>
									</div>
									<div className="flex justify-between text-sm sm:text-base">
										<span>Round:</span>
										<span className="font-bold">{bestRound.id}</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-red-200 dark:border-red-800">
							<CardHeader className="pb-3">
								<CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-base sm:text-lg">
									<Target className="w-4 h-4 sm:w-5 sm:h-5" />
									Most Challenging
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2">
									<div className="flex justify-between text-sm sm:text-base">
										<span>Score:</span>
										<span className="font-bold text-red-600">{formatScore(worstRound.score || 0)}</span>
									</div>
									<div className="flex justify-between text-sm sm:text-base">
										<span>Distance:</span>
										<span className="font-bold">{formatDistance(worstRound.distance || 0)}</span>
									</div>
									<div className="flex justify-between text-sm sm:text-base">
										<span>Round:</span>
										<span className="font-bold">{worstRound.id}</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pb-2">
						<Button
							onClick={handleShare}
							variant="outline"
							className="flex items-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-semibold"
						>
							<Share2 className="w-4 h-4" />
							Share Results
						</Button>

						<Button
							onClick={onNewGame}
							className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white flex items-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
						>
							<RotateCcw className="w-4 h-4" />
							Play Again
						</Button>

						<Button
							onClick={onBackToMenu}
							variant="outline"
							className="flex items-center gap-2 w-full sm:w-auto px-6 py-3 text-base font-semibold"
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
