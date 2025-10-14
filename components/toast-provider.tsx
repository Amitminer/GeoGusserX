'use client';

import React from 'react';
import { useGameStore } from '@/lib/storage/store';
import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * A mapping from toast types to their corresponding Lucide icon components.
 */
const toastIcons = {
	success: CheckCircle,
	error: AlertCircle,
	warning: AlertTriangle,
	info: Info,
};

/**
 * A mapping from toast types to their corresponding CSS classes for styling.
 */
const toastVariants = {
	success: 'border-2 border-green-500/70 bg-green-100/80 dark:bg-green-800/80 text-green-900 dark:text-green-100 shadow-2xl shadow-green-500/30 backdrop-blur-sm',
	error: 'border-2 border-red-500/70 bg-red-100/80 dark:bg-red-800/80 text-red-900 dark:text-red-100 shadow-2xl shadow-red-500/30 backdrop-blur-sm',
	warning: 'border-2 border-amber-500/70 bg-amber-100/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 shadow-2xl shadow-amber-500/30 backdrop-blur-sm',
	info: 'border-2 border-blue-500/70 bg-blue-100/80 dark:bg-blue-800/80 text-blue-900 dark:text-blue-100 shadow-2xl shadow-blue-500/30 backdrop-blur-sm',
};

/**
 * A component that renders toast notifications from the global game state.
 * It subscribes to the `toasts` array in the `useGameStore` and displays a toast
 * for each item in the array.
 */
export function ToastSystem() {
	const { toasts, removeToast } = useGameStore();

	return (
		<ToastProvider>
			{toasts.map((toast) => {
				const Icon = toastIcons[toast.type];
				return (
					<Toast
						key={toast.id}
						className={`${toastVariants[toast.type]} rounded-lg transform transition-all duration-300 hover:scale-[1.02]`}
						// When the toast is closed (either by the user or automatically), it is removed from the global state.
						onOpenChange={(open) => {
							if (!open) {
								removeToast(toast.id);
							}
						}}
					>
						<div className="flex items-center gap-3">
							<div className={`
								w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
								${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
								${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
								${toast.type === 'warning' ? 'bg-amber-500 text-white' : ''}
								${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
							`}>
								<Icon className="w-4 h-4" />
							</div>

							<div className="flex-1">
								<ToastTitle className="font-bold text-sm">
									{toast.title}
								</ToastTitle>
								{toast.description && (
									<ToastDescription className="text-xs mt-1 opacity-90">
										{toast.description}
									</ToastDescription>
								)}
							</div>
						</div>
						<ToastClose />
					</Toast>
				);
			})}
			<ToastViewport />
		</ToastProvider>
	);
}