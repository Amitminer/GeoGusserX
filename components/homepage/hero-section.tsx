'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Globe, Users, Play } from 'lucide-react';

export function HeroSection() {
	return (
		<section className="container mx-auto px-4 py-12 sm:py-20 relative z-10">
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.3 }}
				className="mb-12 text-center"
			>
				{/* Logo and Title */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.1, duration: 0.3 }}
					className="mb-6 sm:mb-8 inline-flex items-center gap-3 sm:gap-4 lg:gap-6"
				>
					<div className="relative">
						<motion.div
							className="flex h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 items-center justify-center rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-2xl ring-2 sm:ring-4 ring-blue-500/20 dark:ring-blue-400/20"
							whileHover={{ rotate: 360, scale: 1.1 }}
							transition={{ duration: 0.6 }}
						>
							<Globe className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
						</motion.div>
						<div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 blur-lg opacity-30 -z-10"></div>
					</div>
					<div className="text-left">
						<h1 className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-transparent tracking-tight">
							GeoGusserX
						</h1>
						<p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 font-medium">
							Explore the world, one guess at a time
						</p>
					</div>
				</motion.div>

				{/* Description */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2, duration: 0.3 }}
					className="mb-8 sm:mb-10 max-w-3xl leading-relaxed text-gray-700 dark:text-gray-300 text-lg sm:text-xl lg:text-2xl mx-auto font-light px-4"
				>
					Test your geography knowledge with this game inspired by GeoGuessr. Explore 32 countries with over 858 carefully curated regions,
					from bustling cities to remote landscapes. Guess locations from Street View images and compete for the highest score!
				</motion.p>

				{/* Game Mode Selection */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.3, duration: 0.3 }}
					className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
				>
					<Link href="/config">
						<motion.div
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<Button
								size="lg"
								className="group bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-5 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
							>
								<Play className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
								Single Player
							</Button>
						</motion.div>
					</Link>

					<motion.div
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
					>
						<Button
							size="lg"
							variant="outline"
							disabled
							className="relative px-10 py-5 text-lg font-semibold border-2 border-gray-300/50 text-gray-400 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/50 dark:border-gray-600/50 dark:text-gray-500 backdrop-blur-sm rounded-xl"
							title="Coming soon! Multiplayer features are in development"
						>
							<Users className="mr-3 h-5 w-5" />
							Multiplayer
							<span className="absolute -right-2 -top-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-1 text-xs text-white font-medium shadow-lg">
								SOON
							</span>
						</Button>
					</motion.div>
				</motion.div>

				{/* Quick Stats */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.4, duration: 0.3 }}
					className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4"
				>
					{[
						{ value: '32', label: 'Countries', color: 'text-blue-600' },
						{ value: '858+', label: 'Regions', color: 'text-purple-600' },
						{ value: '5000', label: 'Max Score', color: 'text-green-600' },
						{ value: '4', label: 'Game Modes', color: 'text-orange-600' }
					].map((stat, index) => (
						<motion.div
							key={index}
							className="text-center p-4 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg"
							whileHover={{
								y: -4,
								transition: { type: 'spring', stiffness: 300 }
							}}
						>
							<div className={`text-3xl font-bold ${stat.color} sm:text-4xl mb-1`}>
								{stat.value}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
								{stat.label}
							</div>
						</motion.div>
					))}
				</motion.div>
			</motion.div>
		</section>
	);
}
