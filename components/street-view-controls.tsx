'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HorizontalSlider } from '@/components/ui/joystick';
import { Gamepad2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StreetViewControlsProps {
	panorama: google.maps.StreetViewPanorama | null;
	showControls?: boolean;
}

export function StreetViewControls({ 
	panorama, 
	showControls = true 
}: StreetViewControlsProps) {
	const [isMobile, setIsMobile] = useState(false);
	const [isSliderVisible, setIsSliderVisible] = useState(true);
	const [isSliderActive, setIsSliderActive] = useState(false);
	const animationFrameRef = useRef<number | undefined>(undefined);
	const movementRef = useRef({ x: 0, y: 0 });
	const inactivityTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

	// Detect mobile device
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Animation loop for smooth camera movement
	useEffect(() => {
		const animate = () => {
			if (panorama && (movementRef.current.x !== 0 || movementRef.current.y !== 0)) {
				const currentPov = panorama.getPov();

				// Calculate movement speed (optimized for smooth control)
				const rotationSpeed = 1.2; // degrees per frame (slightly faster)

				const newHeading = currentPov.heading + (movementRef.current.x * rotationSpeed);
				// Only allow horizontal movement - no up/down pitch control
				const newPitch = currentPov.pitch; // Keep current pitch unchanged

				panorama.setPov({
					heading: newHeading,
					pitch: newPitch
				});
			}

			animationFrameRef.current = requestAnimationFrame(animate);
		};

		animationFrameRef.current = requestAnimationFrame(animate);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
		};
	}, [panorama]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (inactivityTimeoutRef.current) {
				clearTimeout(inactivityTimeoutRef.current);
			}
		};
	}, []);

	const handleSliderStart = () => {
		setIsSliderActive(true);
		// Clear any existing timeout
		if (inactivityTimeoutRef.current) {
			clearTimeout(inactivityTimeoutRef.current);
		}
	};

	const handleSliderMove = (position: { x: number; y: number }) => {
		movementRef.current = position;
	};

	const handleSliderEnd = () => {
		movementRef.current = { x: 0, y: 0 };
		
		// Set timeout to make slider transparent after inactivity
		inactivityTimeoutRef.current = setTimeout(() => {
			setIsSliderActive(false);
		}, 2000); // 2 seconds of inactivity
	};

	const toggleSliderVisibility = () => {
		setIsSliderVisible(!isSliderVisible);
	};



	if (!showControls || !isMobile) return null;

	return (
		<>
			{/* Centered Virtual Joystick */}
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

							{/* Slider label - only show when active */}
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

			{/* Control buttons - positioned in bottom-left */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.8 }}
				className="absolute bottom-6 left-6 flex flex-col gap-2 z-50"
			>
				{/* Slider toggle button */}
				<Button
					variant="secondary"
					size="sm"
					onClick={toggleSliderVisibility}
					className={`${
						isSliderVisible 
							? 'bg-blue-600/80 hover:bg-blue-700/80 text-white' 
							: 'bg-black/70 hover:bg-black/80 text-white'
					} border-white/20 backdrop-blur-sm transition-colors`}
					title={isSliderVisible ? 'Hide slider' : 'Show slider'}
				>
					{isSliderVisible ? <EyeOff className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
				</Button>


			</motion.div>
		</>
	);
}
