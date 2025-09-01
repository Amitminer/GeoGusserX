'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/storage/store';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatScore } from '@/lib/utils';
import { Trophy, MapPin, Clock, Home } from 'lucide-react';

interface GameHeaderProps {
	onEndGame?: () => void;
}

export function GameHeader({ onEndGame }: GameHeaderProps) {
	const { currentGame } = useGameStore();

	if (!currentGame) return null;

	const currentRound = currentGame.currentRoundIndex + 1;
	const totalRounds = currentGame.mode === 'infinite' ? '∞' : currentGame.rounds.length;
	const progress = currentGame.mode === 'infinite' ? 100 : (currentRound / currentGame.rounds.length) * 100;

	return (
		<motion.header
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3"
		>
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				{/* Logo and Game Info */}
				<div className="flex items-center gap-6">
					<motion.div
						whileHover={{ scale: 1.05 }}
						className="flex items-center gap-2"
					>
						<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
							<MapPin className="w-5 h-5 text-white" />
						</div>
						<span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							GeoGusserX
						</span>
					</motion.div>

					<div className="hidden sm:flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
						<div className="flex items-center gap-1">
							<Clock className="w-4 h-4" />
							<span>Round {currentRound} of {totalRounds}</span>
						</div>
						<div className="flex items-center gap-1">
							<Trophy className="w-4 h-4" />
							<span>{formatScore(currentGame.totalScore)} pts</span>
						</div>
					</div>
				</div>

				{/* Progress and Controls */}
				<div className="flex items-center gap-4">
					{/* Progress Bar */}
					{currentGame.mode !== 'infinite' && (
						<div className="hidden md:flex items-center gap-2 min-w-[120px]">
							<span className="text-xs text-gray-500">Progress</span>
							<Progress value={progress} className="w-20" />
						</div>
					)}

					{/* Score Display (Mobile) */}
					<div className="sm:hidden flex items-center gap-1 text-sm">
						<Trophy className="w-4 h-4" />
						<span>{formatScore(currentGame.totalScore)}</span>
					</div>

					{/* End Game Button */}
					{onEndGame && (
						<Button
							variant="outline"
							size="sm"
							onClick={onEndGame}
							className="flex items-center gap-1"
						>
							<Home className="w-4 h-4" />
							<span className="hidden sm:inline">End Game</span>
						</Button>
					)}
				</div>
			</div>

			{/* Mobile Progress */}
			{currentGame.mode !== 'infinite' && (
				<div className="md:hidden mt-3">
					<div className="flex items-center justify-between text-xs text-gray-500 mb-1">
						<span>Round {currentRound} of {totalRounds}</span>
						<span>{Math.round(progress)}% Complete</span>
					</div>
					<Progress value={progress} className="w-full" />
				</div>
			)}
		</motion.header>
	);
}
