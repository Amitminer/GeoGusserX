'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, EyeOff, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HorizontalSlider } from '@/components/ui/horizontal-slider';
import { useGameStore } from '@/lib/storage/store';

/**
 * Props for the `StreetViewControls` component.
 */
interface StreetViewControlsProps {
  /** The Google Maps Street View panorama instance. */
  panorama: google.maps.StreetViewPanorama | null;
  /** A boolean to show or hide the controls. */
  showControls?: boolean;
  /** An optional callback function to be triggered when the user skips a round. */
  onSkipRound?: () => void;
}

/**
 * A component that provides on-screen controls for the Street View panorama on mobile devices.
 * It includes a virtual joystick for looking left and right, and buttons for toggling the controls
 * and skipping the round.
 */
export function StreetViewControls({
	panorama,
	showControls = true,
	onSkipRound
}: StreetViewControlsProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [isSliderVisible, setIsSliderVisible] = useState(true);
	const [isSliderActive, setIsSliderActive] = useState(false);
	const animationFrameRef = useRef<number | undefined>(undefined);
	const movementRef = useRef({ x: 0, y: 0 });
	const inactivityTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	const { showGameComplete, currentGame } = useGameStore();

	/**
	 * This effect detects if the user is on a mobile device.
	 */
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	/**
	 * This effect manages the animation loop for smooth camera movement.
	 * It uses `requestAnimationFrame` to efficiently update the panorama's point of view.
	 */
	useEffect(() => {
		let isAnimating = false;

		const animate = () => {
			if (panorama && (movementRef.current.x !== 0 || movementRef.current.y !== 0) && !showGameComplete) {
				const currentPov = panorama.getPov();
				const rotationSpeed = 1.2;
				const newHeading = currentPov.heading + (movementRef.current.x * rotationSpeed);
				const newPitch = currentPov.pitch;

				panorama.setPov({
					heading: newHeading,
					pitch: newPitch
				});

				animationFrameRef.current = requestAnimationFrame(animate);
			} else {
				isAnimating = false;
				animationFrameRef.current = undefined;
			}
		};

		const startAnimation = () => {
			if (!isAnimating && panorama) {
				isAnimating = true;
				animationFrameRef.current = requestAnimationFrame(animate);
			}
		};

		(window as Window & { startStreetViewAnimation?: () => void }).startStreetViewAnimation = startAnimation;

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			(window as Window & { startStreetViewAnimation?: () => void }).startStreetViewAnimation = undefined;
		};
	}, [panorama, showGameComplete]);

	useEffect(() => {
		return () => {
			if (inactivityTimeoutRef.current) {
				clearTimeout(inactivityTimeoutRef.current);
			}
		};
	}, []);

	const handleSliderStart = () => {
		setIsSliderActive(true);
		if (inactivityTimeoutRef.current) {
			clearTimeout(inactivityTimeoutRef.current);
		}
	};

	const handleSliderMove = (position: { x: number; y: number }) => {
		movementRef.current = position;
		const windowWithAnimation = window as Window & { startStreetViewAnimation?: () => void };
		if ((position.x !== 0 || position.y !== 0) && windowWithAnimation.startStreetViewAnimation) {
			windowWithAnimation.startStreetViewAnimation();
		}
	};

	const handleSliderEnd = () => {
		movementRef.current = { x: 0, y: 0 };

		inactivityTimeoutRef.current = setTimeout(() => {
			setIsSliderActive(false);
		}, 2000);
	};

	const toggleSliderVisibility = () => {
		setIsSliderVisible(!isSliderVisible);
	};

	if (!showControls || !isMobile) return null;

	return (
		<>
			{/* The virtual joystick for looking left and right. */}
			<AnimatePresence>
				{isSliderVisible && (
					<motion.div
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{
							opacity: isSliderActive ? 1 : 0.3,
							scale: 1
						}}
						exit={{ opacity: 0, scale: 0.8 }}
						transition={{ duration: 0.3 }}
						className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-40"
					>
						<div className="relative">
							<HorizontalSlider
								onStart={handleSliderStart}
								onMove={handleSliderMove}
								onEnd={handleSliderEnd}
								width={200}
								height={60}
								knobSize={40}
								className="drop-shadow-lg"
							/>

							{isSliderActive && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 10 }}
									className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
								>
									<div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
										Look Left/Right
									</div>
								</motion.div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Buttons for toggling the slider and skipping the round. */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
				className="absolute bottom-6 left-6 flex flex-col gap-2 z-50"
			>
				<Button
					variant="secondary"
					size="sm"
					onClick={toggleSliderVisibility}
					className={`${isSliderVisible
						? 'bg-blue-600/80 hover:bg-blue-700/80 text-white'
						: 'bg-black/70 hover:bg-black/80 text-white'
						} border-white/20 backdrop-blur-sm transition-colors`}
					title={isSliderVisible ? 'Hide slider' : 'Show slider'}
				>
					{isSliderVisible ? <EyeOff className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
				</Button>

				{currentGame && onSkipRound && (
					<Button
						variant="secondary"
						size="sm"
						onClick={onSkipRound}
						className="bg-orange-600/80 hover:bg-orange-700/80 text-white border-white/20 backdrop-blur-sm transition-colors"
						title={currentGame.mode === 'infinite' ? 'Skip to new location' : 'Skip to next round'}
					>
						<SkipForward className="w-4 h-4" />
					</Button>
				)}


			</motion.div>
		</>
	);
}