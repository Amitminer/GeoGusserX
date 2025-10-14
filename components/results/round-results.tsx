'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultsMap } from '@/components/results/results-map';
import { GuessResult } from '@/lib/types';
import { formatDistance, formatScore } from '@/lib/utils';
import { Trophy, MapPin, Target, ArrowRight } from 'lucide-react';

/**
 * Props for the `RoundResults` component.
 */
interface RoundResultsProps {
  /** The result of the user's guess for the round. */
  result: GuessResult;
  /** The number of the current round. */
  roundNumber: number;
  /** A callback function to proceed to the next round. */
  onNextRound: () => void;
  /** An optional callback function to end the game. */
  onEndGame?: () => void;
  /** A boolean indicating whether this is the last round of the game. */
  isLastRound: boolean;
}

/**
 * A component that displays the results of a single round, including the score,
 * the distance from the actual location, and a map showing both locations.
 */
export function RoundResults({ result, roundNumber, onNextRound, onEndGame, isLastRound }: RoundResultsProps) {

	/**
	 * Returns a CSS class for the score color based on the score value.
	 * @param score The score for the round.
	 * @returns A string containing the CSS class for the color.
	 */
	const getScoreColor = (score: number) => {
		if (score >= 4000) return 'text-green-500';
		if (score >= 2500) return 'text-yellow-500';
		if (score >= 1000) return 'text-orange-500';
		return 'text-red-500';
	};

	/**
	 * Returns a message based on the score, providing feedback to the player.
	 * @param score The score for the round.
	 * @returns A string containing the feedback message.
	 */
	const getScoreMessage = (score: number) => {
		if (score >= 4500) return 'Incredible! 🎯';
		if (score >= 3500) return 'Excellent! 🌟';
		if (score >= 2500) return 'Great job! 👏';
		if (score >= 1500) return 'Good guess! 👍';
		if (score >= 500) return 'Not bad! 🤔';
		return 'Better luck next time! 💪';
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className="fixed inset-0 bg-gradient-to-br from-blue-50/95 via-white/90 to-purple-50/95 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto"
		>
			<motion.div
				initial={{ y: 20, opacity: 0, scale: 0.95 }}
				animate={{ y: 0, opacity: 1, scale: 1 }}
				transition={{ duration: 0.3, ease: "easeOut" }}
				className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-2xl w-full max-w-6xl min-h-[80vh] max-h-[90vh] my-4 overflow-hidden flex flex-col"
			>
				<div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 text-white p-3 sm:p-4 rounded-t-3xl">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg sm:text-xl font-bold">
								Round {roundNumber} Results
							</h2>
							<p className="text-blue-100 text-xs sm:text-sm">
								{getScoreMessage(result.score)}
							</p>
						</div>
						<div className="text-right">
							<div className="text-xl sm:text-2xl font-bold text-white">
								{formatScore(result.score)}
							</div>
							<div className="text-blue-100 text-xs">points</div>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto">
					<div className="p-4 sm:p-6 lg:p-8">
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

							{/* This column displays the performance breakdown for the round. */}
							<div className="space-y-4 sm:space-y-6">
								<div>
									<h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-gray-800 dark:text-gray-200">
										Performance Breakdown
									</h3>

									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
										<Card className="border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-lg rounded-2xl">
											<CardHeader className="pb-2 sm:pb-3">
												<CardTitle className="text-sm sm:text-base flex items-center gap-2 sm:gap-3">
													<div className="p-1.5 sm:p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
														<Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
													</div>
													Distance from Target
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-1">
													{formatDistance(result.distance)}
												</div>
												<div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
													from actual location
												</div>
											</CardContent>
										</Card>

										<Card className="border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:border-yellow-400 dark:hover:border-yellow-500 transition-all duration-300 hover:shadow-lg rounded-2xl">
											<CardHeader className="pb-2 sm:pb-3">
												<CardTitle className="text-sm sm:text-base flex items-center gap-2 sm:gap-3">
													<div className="p-1.5 sm:p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
														<Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 dark:text-yellow-400" />
													</div>
													Round Score
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 ${getScoreColor(result.score)}`}>
													{formatScore(result.score)}
												</div>
												<div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
													out of 5,000 points
												</div>
											</CardContent>
										</Card>

										<Card className="border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:border-green-400 dark:hover:border-green-500 transition-all duration-300 hover:shadow-lg rounded-2xl">
											<CardHeader className="pb-2 sm:pb-3">
												<CardTitle className="text-sm sm:text-base flex items-center gap-2 sm:gap-3">
													<div className="p-1.5 sm:p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
														<MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
													</div>
													Accuracy Rating
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
													{((result.score / 5000) * 100).toFixed(1)}%
												</div>
												<div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
													accuracy percentage
												</div>
											</CardContent>
										</Card>
									</div>
								</div>

								{/* The main action button to proceed to the next round or view the final results. */}
								<div className="mt-4 sm:mt-6">
									<Button
										onClick={() => {
											if (isLastRound && onEndGame) {
												onEndGame();
											} else {
												onNextRound();
											}
										}}
										size="lg"
										className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 w-full text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
									>
										{isLastRound ? (
											<>
												View Final Results
												<Trophy className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
											</>
										) : (
											<>
												Continue to Next Round
												<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
											</>
										)}
									</Button>
								</div>
							</div>

							{/* This column displays the results map. */}
							<div className="lg:h-full">
								<Card className="border-2 border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl h-full">
									<CardHeader className="pb-2 sm:pb-3">
										<CardTitle className="text-base sm:text-lg lg:text-xl flex items-center gap-2">
											<MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
											Your Guess vs Actual Location
										</CardTitle>
									</CardHeader>
									<CardContent className="p-0 h-64 sm:h-80 lg:h-96">
										<div className="h-full rounded-b-2xl overflow-hidden mx-3 sm:mx-4 mb-3 sm:mb-4">
											<ResultsMap
												actualLocation={result.actualLocation}
												guessedLocation={result.guessedLocation}
											/>
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}