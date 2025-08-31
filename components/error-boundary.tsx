'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

interface ErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// Use our custom logger instead of console.error
		logger.error('ErrorBoundary caught an error', error, 'ErrorBoundary', errorInfo);
	}

	render() {
		if (this.state.hasError) {
			const reset = () => {
				this.setState({ hasError: false, error: undefined });
			};

			if (this.props.fallback) {
				const FallbackComponent = this.props.fallback;
				return <FallbackComponent error={this.state.error} reset={reset} />;
			}

			return <DefaultErrorFallback error={this.state.error} reset={reset} />;
		}

		return this.props.children;
	}
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
	const handleReload = () => {
		window.location.reload();
	};

	const handleGoHome = () => {
		window.location.href = '/';
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
			<div className="max-w-md w-full text-center">
				<div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
					<AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" suppressHydrationWarning />

					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
						Oops! Something went wrong
					</h1>

					<p className="text-gray-600 dark:text-gray-300 mb-6">
						We encountered an unexpected error. Don&apos;t worry, it&apos;s not your fault!
					</p>

					{process.env.NODE_ENV === 'development' && error && (
						<details className="text-left mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
							<summary className="cursor-pointer font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
								Error Details (Development)
							</summary>
							<pre className="text-xs text-red-600 dark:text-red-400 overflow-auto">
								{error.message}
								{error.stack && '\n\n' + error.stack}
							</pre>
						</details>
					)}

					<div className="space-y-3">
						<Button
							onClick={reset}
							className="w-full bg-blue-600 hover:bg-blue-700 text-white"
						>
							<RefreshCw className="w-4 h-4 mr-2" suppressHydrationWarning />
							Try Again
						</Button>

						<Button
							onClick={handleReload}
							variant="outline"
							className="w-full"
						>
							<RefreshCw className="w-4 h-4 mr-2" suppressHydrationWarning />
							Reload Page
						</Button>

						<Button
							onClick={handleGoHome}
							variant="ghost"
							className="w-full"
						>
							<Home className="w-4 h-4 mr-2" suppressHydrationWarning />
							Go Home
						</Button>
					</div>
				</div>

				<p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
					If this problem persists, please contact support.
				</p>
			</div>
		</div>
	);
}

export default ErrorBoundary;
