"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users, Play } from "lucide-react";

/**
 * A component that displays the hero section of the homepage.
 * It includes the main title, a brief description of the game, call-to-action buttons,
 * and some key statistics about the game.
 */
export function HeroSection() {
	return (
		<section className="container mx-auto px-4 py-12 sm:py-20 relative z-10 max-w-7xl">
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
				{/* Left Column: Title, Description, and Actions */}
				<div className="lg:col-span-7 text-center lg:text-left space-y-6 sm:space-y-8">
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1, duration: 0.3 }}
						className="flex flex-col sm:flex-row items-center lg:items-start gap-4"
					>
						<div className="relative">
							<motion.div
								className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center"
								whileHover={{ scale: 1.05, rotate: 5 }}
								transition={{ duration: 0.3 }}
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img 
									src="/icon.png" 
									alt="GeoGusserX Logo" 
									className="w-full h-full object-contain" 
								/>
							</motion.div>
						</div>
						<div className="flex flex-col justify-center text-center sm:text-left">
							<h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
								GeoGusserX
							</h1>
						</div>
					</motion.div>

					<motion.p
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.2, duration: 0.3 }}
						className="max-w-2xl text-slate-650 dark:text-slate-300 text-base sm:text-lg lg:text-xl font-normal leading-relaxed mx-auto lg:mx-0"
					>
						Test your geography knowledge with this game inspired by GeoGuessr. Explore 32 countries with over 858 carefully curated regions,
						from bustling cities to remote landscapes. Guess locations from Street View images and compete for the highest score!
					</motion.p>

					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.3, duration: 0.3 }}
						className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
					>
						<Link href="/config">
							<motion.div
								whileHover={{ scale: 1.03 }}
								whileTap={{ scale: 0.97 }}
								className="w-full sm:w-auto"
							>
								<Button
									size="lg"
									className="group bg-blue-600 hover:bg-blue-700 px-8 py-4 text-base font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl w-full"
								>
									<Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
									Single Player
								</Button>
							</motion.div>
						</Link>

						<motion.div
							whileHover={{ scale: 1.03 }}
							whileTap={{ scale: 0.97 }}
							className="w-full sm:w-auto"
						>
							<Button
								size="lg"
								variant="outline"
								disabled
								className="relative px-8 py-4 text-base font-semibold border-2 border-gray-300/50 text-gray-400 cursor-not-allowed bg-gray-50/50 dark:bg-gray-800/50 dark:border-gray-600/50 dark:text-gray-500 backdrop-blur-sm rounded-xl w-full"
								title="Coming soon! Multiplayer features are in development"
							>
								<Users className="mr-2 h-5 w-5" />
								Multiplayer
								<span className="absolute -right-2 -top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white font-medium shadow-md">
									SOON
								</span>
							</Button>
						</motion.div>
					</motion.div>
				</div>

				{/* Right Column: Statistics Grid Card */}
				<div className="lg:col-span-5 w-full">
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.4, duration: 0.4 }}
						className="grid grid-cols-2 gap-4 sm:gap-6 bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/50 p-6 sm:p-8 rounded-3xl backdrop-blur-md shadow-xl"
					>
						{[
							{ value: '32', label: 'Countries', color: 'text-blue-600 dark:text-blue-400', desc: 'Global exploration' },
							{ value: '858+', label: 'Regions', color: 'text-purple-600 dark:text-purple-400', desc: 'Curated regions' },
							{ value: '5000', label: 'Max Score', color: 'text-emerald-600 dark:text-emerald-400', desc: 'Per round perfect score' },
							{ value: '4', label: 'Game Modes', color: 'text-orange-600 dark:text-orange-400', desc: 'Play styles' }
						].map((stat, index) => (
							<motion.div
								key={index}
								className="text-left p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-md hover:shadow-lg transition-shadow duration-300"
								whileHover={{
									y: -4,
									transition: { type: 'spring', stiffness: 300 }
								}}
							>
								<div className={`text-2xl sm:text-3xl font-extrabold ${stat.color} mb-0.5`}>
									{stat.value}
								</div>
								<div className="text-sm font-bold text-gray-850 dark:text-gray-200">
									{stat.label}
								</div>
								<div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
									{stat.desc}
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</div>
		</section>
	);
}
