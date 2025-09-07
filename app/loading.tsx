import { Loader2, MapPin } from 'lucide-react';

export default function Loading() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center relative overflow-hidden">
			{/* Floating background elements */}
			<div className="absolute inset-0 opacity-20">
				<div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
				<div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
				<div className="absolute bottom-32 left-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
				<div className="absolute bottom-20 right-20 w-2 h-2 bg-purple-300 rounded-full animate-pulse"></div>
				<div className="absolute top-1/3 left-1/3 w-1 h-1 bg-blue-500 rounded-full animate-ping"></div>
				<div className="absolute top-60 right-1/4 w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
			</div>

			<div className="text-center relative z-10">
				{/* Logo container with animations */}
				<div className="relative mb-8 flex items-center justify-center">
					{/* Outer spinning ring */}
					<div className="absolute w-24 h-24 border-2 border-blue-200 dark:border-blue-800 border-t-blue-500 rounded-full animate-spin"></div>

					{/* Middle pulsing ring */}
					<div className="absolute w-20 h-20 border border-purple-200 dark:border-purple-800 border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }}></div>

					{/* Logo container with rotation and scale animation */}
					<div className="relative">
						<div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto transform transition-all duration-1000 animate-pulse shadow-lg shadow-blue-500/25">
							<MapPin className="w-8 h-8 text-white animate-bounce" suppressHydrationWarning style={{ animationDuration: '2s' }} />
						</div>

						{/* Orbiting loader */}
						<div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
							<Loader2 className="w-6 h-6 absolute -top-3 left-1/2 transform -translate-x-1/2 text-blue-500 animate-pulse" suppressHydrationWarning />
						</div>
					</div>
				</div>

				{/* Title with typing effect */}
				<div className="mb-2">
					<h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-pulse">
						Loading GeoGusserX
					</h2>
				</div>

				{/* Animated description */}
				<div className="mb-6">
					<p className="text-gray-600 dark:text-gray-300 animate-pulse">
						Preparing your geography adventure...
					</p>
					<p className="mt-2 text-sm text-gray-500 dark:text-gray-400 animate-pulse">
						Initializing maps and checking for previous game sessions...
					</p>
				</div>

				{/* Progress dots */}
				<div className="flex justify-center mb-8">
					<div className="flex space-x-2">
						<div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-bounce shadow-lg"></div>
						<div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.2s' }}></div>
						<div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.4s' }}></div>
						<div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.6s' }}></div>
					</div>
				</div>

				{/* Loading bar */}
				<div className="max-w-xs mx-auto">
					<div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
						<div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
					</div>
				</div>

				{/* Floating tips */}
				<div className="mt-8 animate-pulse">
					<p className="text-sm text-gray-500 dark:text-gray-400 italic">
						🗺️ Get ready to explore the world!
					</p>
				</div>
			</div>
		</div>
	);
}
