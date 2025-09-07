'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface SliderPosition {
	x: number;
	y: number;
}

interface HorizontalSliderProps {
	onMove: (position: SliderPosition) => void;
	onStart?: () => void;
	onEnd?: () => void;
	width?: number;
	height?: number;
	knobSize?: number;
	className?: string;
	disabled?: boolean;
}

export function HorizontalSlider({
	onMove,
	onStart,
	onEnd,
	width = 200,
	height = 60,
	knobSize = 40,
	className = '',
	disabled = false
}: HorizontalSliderProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [knobPosition, setKnobPosition] = useState(0);
	const [isVisible, setIsVisible] = useState(false);

	const maxDistance = (width - knobSize) / 2;

	const calculatePosition = useCallback((clientX: number): number => {
		if (!containerRef.current) return 0;

		const rect = containerRef.current.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const deltaX = clientX - centerX;

		// Constrain to slider bounds
		if (Math.abs(deltaX) <= maxDistance) {
			return deltaX;
		} else {
			return deltaX > 0 ? maxDistance : -maxDistance;
		}
	}, [maxDistance]);

	const handleStart = useCallback((clientX: number) => {
		if (disabled) return;

		setIsDragging(true);
		setIsVisible(true);
		onStart?.();

		const position = calculatePosition(clientX);
		setKnobPosition(position);

		// Normalize position to -1 to 1 range
		const normalizedX = position / maxDistance;
		onMove({ x: normalizedX, y: 0 });
	}, [disabled, calculatePosition, maxDistance, onMove, onStart]);

	const handleMove = useCallback((clientX: number) => {
		if (!isDragging || disabled) return;

		const position = calculatePosition(clientX);
		setKnobPosition(position);

		// Normalize position to -1 to 1 range
		const normalizedX = position / maxDistance;
		onMove({ x: normalizedX, y: 0 });
	}, [isDragging, disabled, calculatePosition, maxDistance, onMove]);

	const handleEnd = useCallback(() => {
		if (!isDragging) return;

		setIsDragging(false);
		setIsVisible(false);
		setKnobPosition(0);
		onMove({ x: 0, y: 0 });
		onEnd?.();
	}, [isDragging, onMove, onEnd]);

	// Mouse events
	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		handleStart(e.clientX);
	}, [handleStart]);

	const handleMouseMove = useCallback((e: MouseEvent) => {
		handleMove(e.clientX);
	}, [handleMove]);

	const handleMouseUp = useCallback(() => {
		handleEnd();
	}, [handleEnd]);

	// Touch events
	const handleTouchStart = useCallback((e: React.TouchEvent) => {
		e.preventDefault();
		const touch = e.touches[0];
		handleStart(touch.clientX);
	}, [handleStart]);

	const handleTouchMove = useCallback((e: TouchEvent) => {
		e.preventDefault();
		const touch = e.touches[0];
		if (touch) {
			handleMove(touch.clientX);
		}
	}, [handleMove]);

	const handleTouchEnd = useCallback((e: TouchEvent) => {
		e.preventDefault();
		handleEnd();
	}, [handleEnd]);

	// Add global event listeners
	useEffect(() => {
		if (isDragging) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseup', handleMouseUp);
			document.addEventListener('touchmove', handleTouchMove, { passive: false });
			document.addEventListener('touchend', handleTouchEnd, { passive: false });

			return () => {
				document.removeEventListener('mousemove', handleMouseMove);
				document.removeEventListener('mouseup', handleMouseUp);
				document.removeEventListener('touchmove', handleTouchMove);
				document.removeEventListener('touchend', handleTouchEnd);
			};
		}
	}, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

	if (disabled) return null;

	return (
		<motion.div
			ref={containerRef}
			className={`relative select-none ${className}`}
			style={{
				width: width,
				height: height,
				touchAction: 'none'
			}}
			onMouseDown={handleMouseDown}
			onTouchStart={handleTouchStart}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ 
				opacity: isVisible ? 1 : 0.7, 
				scale: isVisible ? 1.05 : 1 
			}}
			transition={{ duration: 0.2 }}
		>
			{/* Slider Track */}
			<div
				className="absolute inset-0 rounded-full bg-black/30 border-2 border-white/40 backdrop-blur-sm"
				style={{
					boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.15)'
				}}
			>
				{/* Center indicator */}
				<div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-white/50 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
			</div>

			{/* Slider Knob */}
			<motion.div
				className="absolute rounded-full bg-white/90 border-2 border-gray-300 shadow-lg"
				style={{
					width: knobSize,
					height: knobSize,
					left: '50%',
					top: '50%',
					boxShadow: '0 2px 8px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3)'
				}}
				animate={{
					x: knobPosition - knobSize / 2,
					y: -knobSize / 2,
					scale: isDragging ? 1.1 : 1
				}}
				transition={{ type: 'spring', stiffness: 300, damping: 30 }}
			>
				{/* Knob highlight */}
				<div className="absolute top-1 left-1 w-2 h-2 bg-white/60 rounded-full" />
			</motion.div>

			{/* Direction indicators - only left/right */}
			{isVisible && (
				<>
					{/* Left arrow */}
					<div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/70 text-lg">
						←
					</div>
					{/* Right arrow */}
					<div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/70 text-lg">
						→
					</div>
				</>
			)}
		</motion.div>
	);
}