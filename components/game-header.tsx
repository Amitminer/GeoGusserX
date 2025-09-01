'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/lib/storage/store';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatScore } from '@/lib/utils';
import { Trophy, MapPin, Clock, Home, Zap } from 'lucide-react';

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
			className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 sticky top-0 z-50"
		>
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				{/* Logo and Game Info */}
				<div className="flex items-center gap-4 md:gap-6">
					<motion.div
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className="flex items-center gap-2"
					>
						<div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
							<MapPin className="w-5 h-5 text-white" />
						</div>
						<span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
							GeoGusserX
						</span>
					</motion.div>

					{/* Desktop Stats */}
					<div className="hidden sm:flex items-center gap-3 text-sm">
						<motion.div
							className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-lg"
							whileHover={{ scale: 1.02 }}
						>
							<Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
							<span className="text-blue-700 dark:text-blue-300 font-medium">
								{currentRound}/{totalRounds}
							</span>
						</motion.div>
						<motion.div
							className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg"
							whileHover={{ scale: 1.02 }}
						>
							<Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
							<span className="text-amber-700 dark:text-amber-300 font-medium">
								{formatScore(currentGame.totalScore)}
							</span>
						</motion.div>
					</div>
				</div>

				{/* Controls */}
				<div className="flex items-center gap-3">
					{/* Progress Bar (Desktop) */}
					{currentGame.mode !== 'infinite' && (
						<div className="hidden lg:flex items-center gap-3 min-w-[140px]">
							<span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
								Progress
							</span>
							<div className="relative">
								<Progress
									value={progress}
									className="w-24 h-2 bg-gray-100 dark:bg-gray-800"
								/>
								<motion.div
									className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20"
									animate={{ scale: [1, 1.05, 1] }}
									transition={{ duration: 2, repeat: Infinity }}
								/>
							</div>
						</div>
					)}

					{/* Mobile Score */}
					<motion.div
						className="sm:hidden flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg"
						whileHover={{ scale: 1.02 }}
					>
						<Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
						<span className="text-amber-700 dark:text-amber-300 font-medium text-sm">
							{formatScore(currentGame.totalScore)}
						</span>
					</motion.div>

					{/* End Game Button */}
					{onEndGame && (
						<motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
							<Button
								variant="outline"
								size="sm"
								onClick={onEndGame}
								className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300/50 dark:border-gray-600/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-600 transition-all duration-200"
							>
								<Home className="w-4 h-4" />
								<span className="hidden sm:inline font-medium">End Game</span>
							</Button>
						</motion.div>
					)}
				</div>
			</div>

			{/* Mobile Progress Bar */}
			{currentGame.mode !== 'infinite' && (
				<motion.div
					className="lg:hidden mt-3"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}
				>
					<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
						<span className="flex items-center gap-1 font-medium">
							<Zap className="w-3 h-3" />
							Round {currentRound} of {totalRounds}
						</span>
						<span className="font-medium">{Math.round(progress)}% Complete</span>
					</div>
					<div className="relative">
						<Progress
							value={progress}
							className="w-full h-2 bg-gray-100 dark:bg-gray-800"
						/>
						<motion.div
							className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-10"
							animate={{
								background: [
									'linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)',
									'linear-gradient(to right, #8b5cf6, #ec4899, #3b82f6)',
									'linear-gradient(to right, #ec4899, #3b82f6, #8b5cf6)'
								]
							}}
							transition={{ duration: 3, repeat: Infinity }}
						/>
					</div>
				</motion.div>
			)}
		</motion.header>
	);
}
