'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultsMap } from '@/components/results-map';
import { GuessResult } from '@/lib/types';
import { formatDistance, formatScore } from '@/lib/utils';
import { Trophy, MapPin, Target, ArrowRight } from 'lucide-react';

interface RoundResultsProps {
	result: GuessResult;
	roundNumber: number;
	onNextRound: () => void;
	isLastRound: boolean;
}

export function RoundResults({ result, roundNumber, onNextRound, isLastRound }: RoundResultsProps) {
	const getScoreColor = (score: number) => {
		// TDOD: remove hardcode score values alongs its colors
		if (score >= 4000) return 'text-green-500';
		if (score >= 2500) return 'text-yellow-500';
		if (score >= 1000) return 'text-orange-500';
		return 'text-red-500';
	};

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
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
			>
				<motion.div
					initial={{ y: 30, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					transition={{ delay: 0.1 }}
					className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] max-h-[1000px] overflow-y-auto overscroll-contain touch-pan-y"
				>
				{/* Header */}
				<div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 lg:p-8">
					<div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
						<div className="flex-1">
							<motion.h2
								initial={{ x: -20, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{ delay: 0.2 }}
								className="text-2xl lg:text-4xl font-bold mb-2"
							>
								Round {roundNumber} Results
							</motion.h2>
							<motion.p
								initial={{ x: -20, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{ delay: 0.3 }}
								className="text-blue-100 text-lg lg:text-xl"
							>
								{getScoreMessage(result.score)}
							</motion.p>
						</div>
						<motion.div
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
							className="text-center lg:text-right bg-white/10 backdrop-blur-sm rounded-xl p-4 lg:p-6"
						>
							<div className={`text-3xl lg:text-5xl font-bold text-white mb-1`}>
								{formatScore(result.score)}
							</div>
							<div className="text-blue-100 text-sm lg:text-base">points</div>
						</motion.div>
					</div>
				</div>

				{/* Main content */}
				<div className="flex-1">
					<div className="p-6 lg:p-8 h-full">
						{/* Desktop: Side-by-side layout, Mobile: Stacked */}
						<div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 h-full">

							{/* Left column: Stats */}
							<div className="space-y-6">
								<motion.div
									initial={{ x: -30, opacity: 0 }}
									animate={{ x: 0, opacity: 1 }}
									transition={{ delay: 0.5 }}
								>
											<h3 className="text-xl lg:text-2xl font-bold mb-4 text-foreground">
										Performance Breakdown
									</h3>

									{/* Stats Cards */}
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1 gap-4">
										<Card className="border-2 border-border hover:border-blue-500 transition-all duration-300 hover:shadow-lg">
											<CardHeader className="pb-3">
												<CardTitle className="text-base flex items-center gap-3">
														<div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
														<Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
													</div>
													Distance from Target
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
													{formatDistance(result.distance)}
												</div>
												<div className="text-sm text-muted-foreground">
													from actual location
												</div>
											</CardContent>
										</Card>

										<Card className="border-2 border-border hover:border-yellow-500 transition-all duration-300 hover:shadow-lg">
											<CardHeader className="pb-3">
												<CardTitle className="text-base flex items-center gap-3">
														<div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
														<Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
													</div>
													Round Score
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className={`text-2xl lg:text-3xl font-bold mb-1 ${getScoreColor(result.score)}`}>
													{formatScore(result.score)}
												</div>
												<div className="text-sm text-muted-foreground">
													out of 5,000 points
												</div>
											</CardContent>
										</Card>

										<Card className="border-2 border-border hover:border-green-500 transition-all duration-300 hover:shadow-lg">
											<CardHeader className="pb-3">
												<CardTitle className="text-base flex items-center gap-3">
														<div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
														<MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
													</div>
													Accuracy Rating
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
													{((result.score / 5000) * 100).toFixed(1)}%
												</div>
												<div className="text-sm text-muted-foreground">
													accuracy percentage
												</div>
											</CardContent>
										</Card>
									</div>
								</motion.div>

								{/* Action Button */}
								<motion.div
									initial={{ y: 30, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									transition={{ delay: 0.7 }}
									className="xl:mt-auto pt-4"
								>
									<Button
										onClick={onNextRound}
										size="lg"
										className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 w-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
									>
										{isLastRound ? (
											<>
												View Final Results
												<Trophy className="w-5 h-5 ml-2" />
											</>
										) : (
											<>
												Continue to Next Round
												<ArrowRight className="w-5 h-5 ml-2" />
											</>
										)}
									</Button>
								</motion.div>
							</div>

							{/* Right column */}
							<motion.div
								initial={{ x: 30, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{ delay: 0.6 }}
								className="xl:h-full"
							>
								<Card className="border-2 border-border h-full xl:h-full">
									<CardHeader className="pb-3">
										<CardTitle className="text-lg lg:text-xl flex items-center gap-2">
											<MapPin className="w-5 h-5 text-blue-600" />
											Your Guess vs Actual Location
										</CardTitle>
									</CardHeader>
									<CardContent className="p-0 h-64 sm:h-80 lg:h-96 xl:h-full xl:pb-4">
										<div className="h-full rounded-b-lg xl:rounded-lg overflow-hidden xl:mx-4 xl:mb-4">
											<ResultsMap
												actualLocation={result.actualLocation}
												guessedLocation={result.guessedLocation}
											/>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						</div>
					</div>
				</div>
			</motion.div>
		</motion.div>
	);
}
