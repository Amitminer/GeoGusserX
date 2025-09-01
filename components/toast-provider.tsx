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

const toastIcons = {
	success: CheckCircle,
	error: AlertCircle,
	warning: AlertTriangle,
	info: Info,
};

const toastVariants = {
	success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900 dark:text-green-200',
	error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900 dark:text-red-200',
	warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
	info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function ToastSystem() {
	const { toasts, removeToast } = useGameStore();

	return (
		<ToastProvider>
			{toasts.map((toast) => {
				const Icon = toastIcons[toast.type];
				return (
					<Toast
						key={toast.id}
						className={toastVariants[toast.type]}
						onOpenChange={(open) => {
							if (!open) {
								removeToast(toast.id);
							}
						}}
					>
						<div className="flex items-start gap-3">
							<Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
							<div className="flex-1">
								<ToastTitle>{toast.title}</ToastTitle>
								{toast.description && (
									<ToastDescription>{toast.description}</ToastDescription>
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
