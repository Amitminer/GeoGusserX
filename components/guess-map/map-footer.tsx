'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Location } from '@/lib/types';
import { MapPin, Mouse, MousePointer2, RotateCcw } from 'lucide-react';

interface MapFooterProps {
	guessLocation: Location | null;
	disabled: boolean;
	onMakeGuess: () => void;
	onClearGuess: () => void;
}

export function MapFooter({ guessLocation, disabled, onMakeGuess, onClearGuess }: MapFooterProps) {
	return (
		<motion.div
			className="absolute bottom-0 left-0 right-0 z-10"
			initial={{ y: 100, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ type: "spring", stiffness: 300, damping: 30 }}
		>
			<div className="mx-2 mb-2 md:mx-4 md:mb-4 rounded-lg md:rounded-xl bg-gray-900/95 backdrop-blur-md border border-gray-700/50 shadow-2xl">
				<div className="p-3 md:p-4">
					{/* Guess Location Display */}
					<AnimatePresence>
						{guessLocation && (
							<motion.div
								className="mb-2 md:mb-3 p-2 md:p-3 rounded-md md:rounded-lg bg-gray-800/60 border border-gray-700/30"
								initial={{ opacity: 0, scale: 0.95 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.95 }}
								transition={{ duration: 0.2 }}
							>
								<div className="flex items-center justify-center gap-1.5 md:gap-2 text-xs md:text-sm text-gray-300">
									<MapPin className="w-3 h-3 md:w-4 md:h-4 text-blue-400" />
									<span className="font-mono text-xs md:text-sm">
										{guessLocation.lat.toFixed(3)}, {guessLocation.lng.toFixed(3)}
									</span>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Controls Instructions */}
					<div className="mb-3 md:mb-4">
						<div className="flex items-center justify-center gap-3 md:gap-4 text-xs text-gray-400">
							<div className="flex items-center gap-1">
								<MousePointer2 className="w-2.5 h-2.5 md:w-3 md:h-3" />
								<kbd className="px-1.5 py-0.5 md:px-2 md:py-1 bg-gray-800 text-gray-300 rounded border border-gray-600 text-xs font-mono">
									Click
								</kbd>
								<span className="hidden sm:inline">to place guess</span>
								<span className="sm:hidden">place</span>
							</div>
							<div className="w-px h-3 md:h-4 bg-gray-600"></div>
							<div className="flex items-center gap-1">
								<Mouse className="w-2.5 h-2.5 md:w-3 md:h-3" />
								<kbd className="px-1.5 py-0.5 md:px-2 md:py-1 bg-gray-800 text-gray-300 rounded border border-gray-600 text-xs font-mono">
									Scroll
								</kbd>
								<span className="hidden sm:inline">to zoom</span>
								<span className="sm:hidden">zoom</span>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-center">
						<AnimatePresence mode="wait">
							{guessLocation && !disabled ? (
								<motion.div
									className="flex items-center gap-2 md:gap-3"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
								>
									<Button
										variant="outline"
										size="sm"
										onClick={onClearGuess}
										className="h-8 md:h-9 px-3 md:px-4 text-xs md:text-sm bg-gray-800/80 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500 transition-all duration-200 flex items-center gap-1.5"
									>
										<RotateCcw className="w-3 h-3 md:w-3.5 md:h-3.5" />
										<span className="hidden sm:inline">Clear</span>
										<span className="sm:hidden">×</span>
									</Button>
									<motion.div
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
									>
										<Button
											onClick={onMakeGuess}
											size="sm"
											className="h-8 md:h-9 px-4 md:px-6 text-xs md:text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1.5"
										>
											<MapPin className="w-3 h-3 md:w-3.5 md:h-3.5" />
											Submit
										</Button>
									</motion.div>
								</motion.div>
							) : (
								<motion.div
									className="text-center"
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -10 }}
									transition={{ duration: 0.2 }}
								>
									<p className="text-xs md:text-sm text-gray-400 mb-1.5 md:mb-2">
										{disabled ? 'Game in progress...' : 'Click map to place guess'}
									</p>
									{disabled && (
										<div className="flex justify-center">
											<div className="w-5 h-5 md:w-6 md:h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
										</div>
									)}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>

				{/* Progress Indicator */}
				<AnimatePresence>
					{guessLocation && (
						<motion.div
							className="h-1 bg-gray-800 rounded-b-xl overflow-hidden"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
						>
							<motion.div
								className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
								initial={{ width: "0%" }}
								animate={{ width: "100%" }}
								transition={{ duration: 0.3, ease: "easeOut" }}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
