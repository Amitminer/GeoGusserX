'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/storage/store';
import { Button } from '@/components/ui/button';
import { formatScore } from '@/lib/utils';
import { Trophy, MapPin, Clock, Home } from 'lucide-react';
import { HintsDialog } from '@/components/hints-dialog';
import type { GeocodeResult } from '@/lib/maps/geocoding';

interface GameHeaderProps {
	onEndGame?: () => void;
	currentLocation?: { lat: number; lng: number } | null;
	countryInfo?: GeocodeResult | null;
}

export function GameHeader({ onEndGame, currentLocation, countryInfo }: GameHeaderProps) {
	const { currentGame } = useGameStore();

	if (!currentGame) return null;

	const currentRound = currentGame.currentRoundIndex + 1;
	const totalRounds = currentGame.mode === 'infinite' ? '∞' : currentGame.rounds.length;
	const progress = currentGame.mode === 'infinite' ? 100 : (currentRound / currentGame.rounds.length) * 100;

	return (
		<>
			<motion.header
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 sticky top-0 z-50"
			>
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					{/* Logo and Game Info */}
					<div className="flex items-center gap-2 sm:gap-3 md:gap-4">
						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="flex items-center gap-1.5 sm:gap-2"
						>
							<div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
								<MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
							</div>
							<span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
								GeoGusserX
							</span>
						</motion.div>

						{/* Desktop Stats */}
						<div className="hidden sm:flex items-center gap-2 text-sm">
							<motion.div
								className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
								whileHover={{ scale: 1.02 }}
							>
								<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
								<span className="text-blue-700 dark:text-blue-300 font-medium text-sm">
									{currentRound}/{totalRounds}
								</span>
							</motion.div>
							<motion.div
								className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg"
								whileHover={{ scale: 1.02 }}
							>
								<Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
								<span className="text-amber-700 dark:text-amber-300 font-medium text-sm">
									{formatScore(currentGame.totalScore)}
								</span>
							</motion.div>
						</div>
					</div>

					{/* Controls */}
					<div className="flex items-center gap-2">
						{/* Mobile Round Info */}
						<motion.div
							className="sm:hidden flex items-center gap-1 px-1.5 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
							whileHover={{ scale: 1.02 }}
						>
							<Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
							<span className="text-blue-700 dark:text-blue-300 font-medium text-xs">
								{currentRound}/{totalRounds}
							</span>
						</motion.div>

						{/* Mobile Score */}
						<motion.div
							className="sm:hidden flex items-center gap-1 px-1.5 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg"
							whileHover={{ scale: 1.02 }}
						>
							<Trophy className="w-3 h-3 text-amber-600 dark:text-amber-400" />
							<span className="text-amber-700 dark:text-amber-300 font-medium text-xs">
								{formatScore(currentGame.totalScore)}
							</span>
						</motion.div>

						{/* AI Hints Button */}
						{currentLocation && (
							<HintsDialog
								location={currentLocation}
								countryInfo={countryInfo}
								disabled={false}
							/>
						)}

						{/* End Game Button */}
						{onEndGame && (
							<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
								<Button
									variant="outline"
									size="sm"
									onClick={onEndGame}
									className="flex items-center gap-1 sm:gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300/50 dark:border-gray-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200 px-2 sm:px-3 py-1.5"
								>
									<Home className="w-3 h-3 sm:w-4 sm:h-4" />
									<span className="hidden sm:inline font-medium text-xs sm:text-sm">End Game</span>
								</Button>
							</motion.div>
						)}
					</div>
				</div>
			</motion.header>

			{/* Progress Bar - Directly attached to header */}
			{currentGame.mode !== 'infinite' && (
				<motion.div
					initial={{ opacity: 0, scaleX: 0 }}
					animate={{ opacity: 1, scaleX: 1 }}
					transition={{ delay: 0.2, duration: 0.5 }}
					className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-[60px] sm:top-[68px] z-40"
				>
					<div className="relative h-2">
						<div className="absolute inset-0 bg-gray-200/60 dark:bg-gray-700/60"></div>
						<motion.div
							className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
							initial={{ width: 0 }}
							animate={{ width: `${progress}%` }}
							transition={{ duration: 0.8, ease: "easeOut" }}
						/>
						<motion.div
							className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20"
							animate={{ opacity: [0.3, 0.6, 0.3] }}
							transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
						/>
					</div>
				</motion.div>
			)}
		</>
	);
}
