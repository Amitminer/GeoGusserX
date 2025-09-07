'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}

const pageVariants = {
	initial: {
		opacity: 0,
		y: 20,
		scale: 0.98
	},
	in: {
		opacity: 1,
		y: 0,
		scale: 1
	},
	out: {
		opacity: 0,
		y: -20,
		scale: 1.02
	}
};
const pageTransition = {
	type: 'tween',
	ease: 'anticipate',
	duration: 0.4
} as const;

export function PageTransition({ children, className = '', delay = 0 }: PageTransitionProps) {
	return (
		<motion.div
			initial="initial"
			animate="in"
			exit="out"
			variants={pageVariants}
			transition={{ ...pageTransition, delay }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export function FadeTransition({ children, className = '', delay = 0 }: PageTransitionProps) {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.3, delay }}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export function SlideTransition({ children, className = '', delay = 0, direction = 'up' }: PageTransitionProps & { direction?: 'up' | 'down' | 'left' | 'right' }) {
	const directionVariants = {
		up: { y: 20 },
		down: { y: -20 },
		left: { x: 20 },
		right: { x: -20 }
	};

	return (
		<motion.div
			initial={{ opacity: 0, ...directionVariants[direction] }}
			animate={{ opacity: 1, y: 0, x: 0 }}
			exit={{ opacity: 0, ...directionVariants[direction] }}
			transition={{ duration: 0.3, delay }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
