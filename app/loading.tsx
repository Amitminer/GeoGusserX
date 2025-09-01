import { Loader2, MapPin } from 'lucide-react';

export default function Loading() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
			<div className="text-center">
				<div className="relative mb-8">
					<div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
						<MapPin className="w-8 h-8 text-white" suppressHydrationWarning />
					</div>
					<Loader2 className="w-6 h-6 animate-spin absolute -bottom-1 -right-1 text-blue-500" suppressHydrationWarning />
				</div>

				<h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
					Loading GeoGusserX
				</h2>

				<p className="text-gray-600 dark:text-gray-300">
					Preparing your geography adventure...
				</p>

				<div className="mt-6 flex justify-center">
					<div className="flex space-x-1">
						<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
						<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
						<div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
					</div>
				</div>
			</div>
		</div>
	);
}
