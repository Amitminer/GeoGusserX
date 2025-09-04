'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountrySelection } from '@/components/country-selection';
import { GameMode, CountrySettings } from '@/lib/types';
import { useGameStore } from '@/lib/storage/store';
import { logger } from '@/lib/logger';
import { MapPin, Play, Trophy, Settings, Info, Infinity as InfinityIcon, Activity, Globe, Heart, Eye, EyeOff } from 'lucide-react';
import { SiGithub, SiNextdotjs, SiTypescript } from 'react-icons/si';

interface MainMenuProps {
	onStartGame: (mode: GameMode) => void;
	onShowStats?: () => void;
	onShowSettings?: () => void;
	onShowAbout?: () => void;
	countrySettings: CountrySettings;
	onCountrySettingsChange: (settings: CountrySettings) => void;
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
			icon: <InfinityIcon className="w-6 h-6" />,
			rounds: '∞ Rounds',
			difficulty: 'Endless',
			color: 'from-orange-500 to-red-600'
		}
	];

const menuButtons = [
	{ key: 'stats', icon: Trophy, label: 'Statistics' },
	{ key: 'settings', icon: Settings, label: 'Settings' },
	{ key: 'about', icon: Info, label: 'About' }
] as const;

export function MainMenu({ onStartGame, onShowStats, onShowSettings, onShowAbout, countrySettings, onCountrySettingsChange }: MainMenuProps) {
	const { gameSettings, updateGameSettings } = useGameStore();
	const [selectedMode, setSelectedMode] = useState<GameMode | null>(() => gameSettings.preferredGameMode);

	// Update selected mode when game settings change (e.g., when loaded from storage)
	useEffect(() => {
		if (gameSettings.preferredGameMode && selectedMode !== gameSettings.preferredGameMode) {
			setSelectedMode(gameSettings.preferredGameMode);
		}
	}, [gameSettings.preferredGameMode, selectedMode]);

	const handleStartGame = useCallback(() => {
		if (selectedMode) {
			// Save the selected mode as preferred for next time
			updateGameSettings({ ...gameSettings, preferredGameMode: selectedMode });
			onStartGame(selectedMode);
		}
	}, [selectedMode, onStartGame, gameSettings, updateGameSettings]);

	const handleShowPerformance = useCallback(() => {
		console.log('=== Performance Summary ===');
		console.log(logger.getSummary());
		console.log('\n=== Performance Stats ===');
		console.log(logger.getPerformanceStats);
	}, []);

	const menuButtonHandlers = useMemo(() => ({
		stats: onShowStats,
		settings: onShowSettings,
		about: onShowAbout
	}), [onShowStats, onShowSettings, onShowAbout]);

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1
			}
		}
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 }
	};

	const isDevelopment = process.env.NODE_ENV === 'development';

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
			<div className="container mx-auto px-4 py-6 sm:py-8">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-center mb-8 sm:mb-12"
				>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
						className="inline-flex items-center gap-3 mb-4 sm:mb-6"
					>
						<div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
							<Globe className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
						</div>
						<div className="text-left">
							<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								GeoGusserX
							</h1>
							<p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg">
								Explore the world, one guess at a time
							</p>
						</div>
					</motion.div>
				</motion.div>

				{/* Game Mode Selection */}
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="max-w-4xl mx-auto mb-8"
				>
					<motion.h2
						variants={itemVariants}
						className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8 text-gray-800 dark:text-gray-200"
					>
						Choose Your Adventure
					</motion.h2>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
						{gameModes.map((mode) => (
							<motion.div
								key={mode.mode}
								variants={itemVariants}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Card
									className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${selectedMode === mode.mode
										? 'ring-2 ring-blue-500 shadow-lg scale-105'
										: ''
										}`}
									onClick={() => {
										setSelectedMode(mode.mode);
										// Update preferred mode immediately when selected
										updateGameSettings({ ...gameSettings, preferredGameMode: mode.mode });
									}}
								>
									<CardHeader>
										<CardTitle className="flex items-center gap-3">
											<div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${mode.color} rounded-lg flex items-center justify-center text-white shadow-md`}>
												{mode.icon}
											</div>
											<div>
												<div className="text-lg sm:text-xl font-bold">{mode.title}</div>
												<div className="text-xs sm:text-sm text-gray-500 font-normal">
													{mode.rounds} • {mode.difficulty}
												</div>
											</div>
										</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
											{mode.description}
										</p>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</motion.div>

				{/* Settings Section */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="max-w-md mx-auto mb-6 sm:mb-8 space-y-6"
				>
					{/* Country Selection */}
					<div>
						<div className="text-center mb-4">
							<h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
								Location Preference
							</h3>
							<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
								Choose your exploration area
							</p>
						</div>
						<CountrySelection
							countrySettings={countrySettings}
							onSettingsChange={onCountrySettingsChange}
						/>
					</div>

					{/* Game Settings */}
					<div>
						<div className="text-center mb-4">
							<h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
								Game Settings
							</h3>
							<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
								Customize your gameplay experience
							</p>
						</div>

						{/* Show Country Name Toggle Card */}
						<Card
							className="w-full max-w-sm mx-auto cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200"
							onClick={() => updateGameSettings({ ...gameSettings, showCountryName: !gameSettings.showCountryName })}
						>
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										{gameSettings.showCountryName ? (
											<Eye className="w-4 h-4 text-green-500" />
										) : (
											<EyeOff className="w-4 h-4 text-gray-500" />
										)}
										<div className="text-left">
											<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
												{gameSettings.showCountryName ? "Country Names Visible" : "Country Names Hidden"}
											</p>
											<p className="text-xs text-gray-500 dark:text-gray-400">
												{gameSettings.showCountryName
													? "Easier mode - country names shown"
													: "Challenge mode - no country hints"
												}
											</p>
										</div>
									</div>
									{/* Custom Toggle Button */}
									<div
										className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${gameSettings.showCountryName
											? 'bg-green-600 shadow-lg'
											: 'bg-gray-300 dark:bg-gray-600'
											}`}
										onClick={(e) => {
											e.stopPropagation();
											updateGameSettings({ ...gameSettings, showCountryName: !gameSettings.showCountryName });
										}}
									>
										<span
											className={`h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out flex items-center justify-center ${gameSettings.showCountryName ? 'translate-x-6' : 'translate-x-1'
												}`}
										>
											{gameSettings.showCountryName ? (
												<Eye className="w-3 h-3 text-green-600" />
											) : (
												<EyeOff className="w-3 h-3 text-gray-500" />
											)}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</motion.div>

				{/* Start Game Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.8 }}
					className="text-center mb-6 sm:mb-8"
				>
					<Button
						onClick={handleStartGame}
						disabled={!selectedMode}
						size="lg"
						className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
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
					className="flex flex-wrap justify-center gap-3 sm:gap-4"
				>
					{menuButtons.map(({ key, icon: Icon, label }) => {
						const handler = menuButtonHandlers[key];
						return handler ? (
							<Button
								key={key}
								variant="outline"
								onClick={handler}
								className="flex items-center gap-2 hover:shadow-md transition-all duration-200 text-sm sm:text-base"
							>
								<Icon className="w-4 h-4" />
								{label}
							</Button>
						) : null;
					})}

					{isDevelopment && (
						<Button
							variant="outline"
							onClick={handleShowPerformance}
							className="flex items-center gap-2 border-orange-300 text-orange-600 hover:bg-white hover:shadow-md transition-all duration-200 text-sm sm:text-base"
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
					className="mt-12 sm:mt-16"
				>
					<div className="container mx-auto relative z-10">
						<div className="text-center text-sm text-gray-400 space-y-4">
							{/* GitHub Link */}
							<div className="flex justify-center items-center">
								<a
									href="https://github.com/Amitminer/GeoGusserX"
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center space-x-2 hover:text-cyan-400 transition-colors duration-300 group"
								>
									<SiGithub className="w-4 h-4 group-hover:rotate-12 transition-transform" />
									<span>View on GitHub</span>
								</a>
							</div>

							{/* Decorative dots */}
							<div className="flex justify-center space-x-2">
								<div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
								<div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }}></div>
								<div className="w-1 h-1 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: "1s" }}></div>
							</div>

							{/* Made with ❤️ + Tech Stack */}
							<div className="flex justify-center items-center flex-wrap gap-2 text-gray-400">
								<span>Made with</span>
								<Heart className="w-4 h-4 text-[#FF1493] animate-pulse" />
								<span>and</span>
								<div className="flex items-center gap-1">
									<SiNextdotjs className="w-4 h-4" />
									<span className="text-white font-semibold">Next.js</span>
								</div>
								<span>+</span>
								<div className="flex items-center gap-1">
									<SiTypescript className="w-4 h-4 text-blue-400" />
									<span className="text-blue-400 font-semibold">TypeScript</span>
								</div>
							</div>

							{/* Final line */}
							<div className="pt-2 text-gray-500 font-semibold text-sm">
								A fun geography game for everyone 🌍
							</div>
						</div>
					</div>
				</motion.footer>
			</div>
		</div>
	);
}
