'use client';

import { useState, useEffect } from 'react';
import { isMobile } from 'react-device-detect';

export function OrientationLock({ children }: { children: React.ReactNode }) {
	const [isLandscape, setIsLandscape] = useState(false);

	useEffect(() => {
		const checkOrientation = () => {
			// Simple and reliable check
			const landscape = window.innerWidth > window.innerHeight;
			setIsLandscape(landscape);
		};

		checkOrientation();

		// Listen for orientation changes
		const handleOrientationChange = () => {
			// Small delay to ensure dimensions are updated
			setTimeout(checkOrientation, 100);
		};

		window.addEventListener('resize', handleOrientationChange);
		window.addEventListener('orientationchange', handleOrientationChange);

		return () => {
			window.removeEventListener('resize', handleOrientationChange);
			window.removeEventListener('orientationchange', handleOrientationChange);
		};
	}, []);

	// Only show warning on mobile devices in landscape
	if (isMobile && isLandscape) {
		return (
			<div
				className="fixed inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center z-50 p-6"
				role="dialog"
				aria-labelledby="orientation-title"
				aria-describedby="orientation-description"
			>
				<div className="text-center text-white max-w-sm">
					<div className="text-7xl mb-6 animate-bounce" role="img" aria-label="Mobile phone">
						📱
					</div>
					<h2 id="orientation-title" className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
						Rotate Your Device
					</h2>
					<p id="orientation-description" className="text-lg opacity-90 leading-relaxed mb-6">
						This app works best in portrait mode for the optimal experience.
					</p>
					<div className="flex justify-center space-x-2">
						<div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
						<div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
						<div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
