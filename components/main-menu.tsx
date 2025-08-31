'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GameMode } from '@/lib/types';
import { logger } from '@/lib/logger';
import { MapPin, Play, Trophy, Settings, Info, Infinity, Activity } from 'lucide-react';

interface MainMenuProps {
	onStartGame: (mode: GameMode) => void;
	onShowStats?: () => void;
	onShowSettings?: () => void;
	onShowAbout?: () => void;
}

const gameModes: Array<{
	mode: GameMode;
	title: string;
	description: string;
	icon: React.ReactNode;
	rounds: string;
	difficulty: string;
	color: string;
}> = [
		{
			mode: '4-rounds',
			title: 'Quick Game',
			description: 'Perfect for a quick geography challenge',
			icon: <Play className="w-6 h-6" />,
			rounds: '4 Rounds',
			difficulty: 'Easy',
			color: 'from-green-500 to-emerald-600'
		},
		{
			mode: '5-rounds',
			title: 'Classic',
			description: 'The traditional GeoGuessr experience',
			icon: <MapPin className="w-6 h-6" />,
			rounds: '5 Rounds',
			difficulty: 'Medium',
			color: 'from-blue-500 to-cyan-600'
		},
		{
			mode: '8-rounds',
			title: 'Extended',
			description: 'For serious geography enthusiasts',
			icon: <Trophy className="w-6 h-6" />,
			rounds: '8 Rounds',
			difficulty: 'Hard',
			color: 'from-purple-500 to-violet-600'
		},
		{
			mode: 'infinite',
			title: 'Infinite',
			description: 'Keep playing until you want to stop',
			icon: <Infinity className="w-6 h-6" />,
			rounds: '∞ Rounds',
			difficulty: 'Endless',
			color: 'from-orange-500 to-red-600'
		}
	];

export function MainMenu({ onStartGame, onShowStats, onShowSettings, onShowAbout }: MainMenuProps) {
	const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

	const handleStartGame = () => {
		if (selectedMode) {
			onStartGame(selectedMode);
		}
	};

	const handleShowPerformance = () => {
		console.log('=== Performance Summary ===');
		console.log(logger.getSummary());
		console.log('\n=== Performance Stats ===');
		console.log(logger.getPerformanceStats());
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-12"
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: 'spring' }}
						className="inline-flex items-center gap-3 mb-6"
					>
						<div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
							<MapPin className="w-8 h-8 text-white" />
						</div>
						<div className="text-left">
							<h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								GeoGusserX
							</h1>
							<p className="text-gray-600 dark:text-gray-300 text-lg">
								Explore the world, one guess at a time
							</p>
						</div>
					</motion.div>
				</motion.div>

				{/* Game Mode Selection */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="max-w-4xl mx-auto mb-8"
				>
					<h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">
						Choose Your Adventure
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{gameModes.map((mode, index) => (
							<motion.div
								key={mode.mode}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.4 + index * 0.1 }}
							>
								<Card
									className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${selectedMode === mode.mode
										? 'ring-2 ring-blue-500 shadow-lg scale-105'
										: 'hover:scale-102'
										}`}
									onClick={() => setSelectedMode(mode.mode)}
								>
									<CardHeader>
										<CardTitle className="flex items-center gap-3">
											<div className={`w-12 h-12 bg-gradient-to-r ${mode.color} rounded-lg flex items-center justify-center text-white`}>
												{mode.icon}
											</div>
											<div>
												<div className="text-xl font-bold">{mode.title}</div>
												<div className="text-sm text-gray-500 font-normal">
													{mode.rounds} • {mode.difficulty}
												</div>
											</div>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-600 dark:text-gray-300">
											{mode.description}
										</p>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</motion.div>

				{/* Start Game Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8 }}
					className="text-center mb-8"
				>
					<Button
						onClick={handleStartGame}
						disabled={!selectedMode}
						size="lg"
						className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<Play className="w-5 h-5 mr-2" />
						Start Game
					</Button>
				</motion.div>

				{/* Menu Options */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.9 }}
					className="flex flex-wrap justify-center gap-4"
				>
					{onShowStats && (
						<Button
							variant="outline"
							onClick={onShowStats}
							className="flex items-center gap-2"
						>
							<Trophy className="w-4 h-4" />
							Statistics
						</Button>
					)}

					{onShowSettings && (
						<Button
							variant="outline"
							onClick={onShowSettings}
							className="flex items-center gap-2"
						>
							<Settings className="w-4 h-4" />
							Settings
						</Button>
					)}

					{onShowAbout && (
						<Button
							variant="outline"
							onClick={onShowAbout}
							className="flex items-center gap-2"
						>
							<Info className="w-4 h-4" />
							About
						</Button>
					)}

					{process.env.NODE_ENV === 'development' && (
						<Button
							variant="outline"
							onClick={handleShowPerformance}
							className="flex items-center gap-2 border-orange-300 text-orange-600 hover:bg-orange-50"
						>
							<Activity className="w-4 h-4" />
							Performance
						</Button>
					)}
				</motion.div>

				{/* Footer */}
				<motion.footer
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1.2 }}
					className="text-center mt-16 text-gray-500 dark:text-gray-400"
				>
					<p className="text-sm">
						Built with ❤️ using Next.js, TypeScript, and Google Maps API
					</p>
					<p className="text-xs mt-2">
						© 2024 GeoGusserX. All rights reserved.
					</p>
				</motion.footer>
			</div>
		</div>
	);
}
