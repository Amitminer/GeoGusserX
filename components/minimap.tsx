import React from 'react';
import { Globe } from 'lucide-react';

interface MiniMapProps {
	onExpand: () => void;
	className?: string;
}

export function MiniMap({ onExpand, className }: MiniMapProps) {
	return (
		<div
			className={`w-80 h-64 sm:w-96 sm:h-80 absolute bottom-4 right-4 origin-bottom-right transition-all duration-300 ease-in-out ${className || ''}`}
		>
			<div className="w-full h-full flex flex-col shadow-2xl border-0 bg-gray-900/95 backdrop-blur-sm rounded-lg overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between px-3 py-1.5 md:py-2 border-b bg-gray-800/90 backdrop-blur-sm flex-shrink-0">
					<div className="flex items-center gap-1 md:gap-1.5">
						<Globe className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
						<span className="text-[10px] md:text-xs font-medium text-gray-100">
							Make your guess
						</span>
					</div>
				</div>

				{/* Mini Map Preview */}
				<div
					className="flex-1 w-full h-full bg-gradient-to-br from-blue-900/50 to-green-900/50 flex items-center justify-center cursor-pointer border border-gray-700/50"
					onClick={onExpand}
				>
					<div className="text-center">
						<Globe className="w-8 h-8 mx-auto mb-2 text-blue-400" />
						<div className="text-xs text-gray-300 font-medium">
							Click to expand
						</div>
						<div className="text-[10px] text-gray-400 mt-1">
							World Map
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
