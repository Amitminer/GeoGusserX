'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * The state for the `ErrorBoundary` component.
 */
interface ErrorBoundaryState {
  /** A boolean that is true if an error has been caught. */
  hasError: boolean;
  /** The error that was caught. */
  error?: Error;
}

/**
 * Props for the `ErrorBoundary` component.
 */
interface ErrorBoundaryProps {
  /** The child components that will be protected by the error boundary. */
  children: React.ReactNode;
  /** An optional fallback component to be rendered when an error is caught. */
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>;
}

/**
 * A React Error Boundary component that catches JavaScript errors anywhere in its
 * child component tree, logs those errors, and displays a fallback UI instead of
 * the component tree that crashed.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	/**
	 * This lifecycle method is used to update the state when an error is thrown
	 * by a descendant component.
	 * @param error The error that was thrown.
	 * @returns An object to update the state.
	 */
	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	/**
	 * This lifecycle method is called after an error has been thrown by a descendant component.
	 * It is used for side effects, such as logging the error.
	 * @param error The error that was thrown.
	 * @param errorInfo An object with a `componentStack` key containing information about which component threw the error.
	 */
	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		logger.error('ErrorBoundary caught an error', error, 'ErrorBoundary', errorInfo);
	}

	/**
	 * Renders the child components or a fallback UI if an error has been caught.
	 */
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

/**
 * The default fallback UI that is displayed when an error is caught and no custom
 * fallback is provided. It provides options to retry, reload, or go home.
 * @param error The error that was caught.
 * @param reset A function to reset the error boundary.
 */
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

					{/* In development mode, the error details are displayed to help with debugging. */}
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