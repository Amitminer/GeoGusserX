import React from 'react';

/**
 * Available log levels in order of severity
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Represents a single log entry with metadata
 */
interface LogEntry {
	/** ISO timestamp when the log was created */
	timestamp: string;
	/** Severity level of the log entry */
	level: LogLevel;
	/** The log message */
	message: string;
	/** Optional additional data to log */
	data?: unknown;
	/** Optional source identifier (e.g., component name, module) */
	source?: string;
	/** React error boundary information (for error logs) */
	errorInfo?: React.ErrorInfo;
	/** Performance timing duration in milliseconds */
	duration?: number;
	/** Memory usage at log time in MB */
	memoryUsage?: number;
}

/**
 * Performance and usage statistics for the logging session
 */
interface PerformanceStats {
	/** Total number of logs recorded */
	totalLogs: number;
	/** Count of logs by severity level */
	logsByLevel: Record<LogLevel, number>;
	/** Average memory usage across all logs in MB */
	averageMemoryUsage: number;
	/** Peak memory usage recorded in MB */
	peakMemoryUsage: number;
	/** Timestamp when the logging session started */
	sessionStartTime: number;
	/** Timestamp of the most recent log entry */
	lastLogTime: number;
}

/**
 * Enhanced logging utility with performance monitoring and memory tracking
 *
 * Features:
 * - Development/production environment awareness
 * - Automatic memory usage tracking
 * - Performance timing capabilities
 * - Log filtering and export functionality
 * - Circular buffer to prevent memory leaks
 *
 * @example
 * ```typescript
 * import { logger } from './logger';
 *
 * // Basic logging
 * logger.info('User logged in', { userId: 123 });
 * logger.error('API call failed', error, 'api-service');
 *
 * // Performance timing
 * logger.startTimer('api-call');
 * await fetchData();
 * logger.endTimer('api-call', 'API call completed');
 *
 * // Get statistics
 * console.log(logger.getSummary());
 * ```
 */
class Logger {
	/** Whether we're running in development mode */
	private isDevelopment = process.env.NODE_ENV === 'development';

	/** Internal log storage (circular buffer) */
	private logs: LogEntry[] = [];

	/** Maximum number of logs to keep in memory */
	private maxLogs = 1000;

	/** Performance timestamp when the logger was initialized */
	private sessionStartTime = performance.now();

	/** Map of active performance timers */
	private performanceTimers = new Map<string, number>();

	/**
	 * Gets current memory usage in MB
	 * @returns Memory usage in megabytes, or 0 if not available
	 */
	private getMemoryUsage(): number {
		// @ts-expect-error - performance.memory might not be available in all browsers
		return (performance.memory?.usedJSHeapSize || 0) / 1024 / 1024; // MB
	}

	/**
	 * Creates a new log entry with current timestamp and memory usage
	 * @param level - Log severity level
	 * @param message - Log message
	 * @param data - Optional additional data
	 * @param source - Optional source identifier
	 * @param errorInfo - React error boundary information
	 * @param duration - Optional performance duration
	 * @returns Formatted log entry
	 */
	private createLogEntry(
		level: LogLevel,
		message: string,
		data?: unknown,
		source?: string,
		errorInfo?: React.ErrorInfo,
		duration?: number
	): LogEntry {
		return {
			timestamp: new Date().toISOString(),
			level,
			message,
			data,
			source,
			errorInfo,
			duration,
			memoryUsage: this.getMemoryUsage()
		};
	}

	/**
	 * Adds a log entry to the internal storage
	 * Maintains circular buffer by removing oldest entries when limit is exceeded
	 * @param entry - Log entry to add
	 */
	private addLog(entry: LogEntry) {
		this.logs.push(entry);
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}
	}

	/**
	 * Starts a performance timer with the given name
	 * @param name - Unique identifier for the timer
	 * @example
	 * ```typescript
	 * logger.startTimer('data-processing');
	 * // ... do work ...
	 * logger.endTimer('data-processing', 'Data processing completed');
	 * ```
	 */
	startTimer(name: string) {
		this.performanceTimers.set(name, performance.now());
	}

	/**
	 * Ends a performance timer and optionally logs the duration
	 * @param name - Timer identifier that was used with startTimer
	 * @param message - Optional message to log with the timing result
	 * @returns Duration in milliseconds, or 0 if timer wasn't found
	 * @example
	 * ```typescript
	 * const duration = logger.endTimer('api-call', 'API request completed');
	 * if (duration > 1000) {
	 *   logger.warn('Slow API call detected', { duration });
	 * }
	 * ```
	 */
	endTimer(name: string, message?: string): number {
		const startTime = this.performanceTimers.get(name);
		if (!startTime) {
			this.warn(`Timer '${name}' was not started`);
			return 0;
		}

		const duration = performance.now() - startTime;
		this.performanceTimers.delete(name);

		if (message) {
			this.info(message, { duration: `${duration.toFixed(2)}ms` }, 'performance');
		}

		return duration;
	}

	/**
	 * Logs a debug message (only shown in development)
	 * @param message - Debug message
	 * @param data - Optional additional data to log
	 * @param source - Optional source identifier
	 * @example
	 * ```typescript
	 * logger.debug('Component rendered', { props, state }, 'MyComponent');
	 * ```
	 */
	debug(message: string, data?: unknown, source?: string) {
		const entry = this.createLogEntry('debug', message, data, source);
		this.addLog(entry);

		if (this.isDevelopment) {
			console.debug(`[DEBUG] ${entry.timestamp} - ${message}`, data || '');
		}
	}

	/**
	 * Logs an informational message
	 * @param message - Info message
	 * @param data - Optional additional data to log
	 * @param source - Optional source identifier
	 * @example
	 * ```typescript
	 * logger.info('User action completed', { action: 'save', itemId: 123 });
	 * ```
	 */
	info(message: string, data?: unknown, source?: string) {
		const entry = this.createLogEntry('info', message, data, source);
		this.addLog(entry);

		if (this.isDevelopment) {
			console.info(`[INFO] ${entry.timestamp} - ${message}`, data || '');
		}
	}

	/**
	 * Logs a warning message
	 * @param message - Warning message
	 * @param data - Optional additional data to log
	 * @param source - Optional source identifier
	 * @example
	 * ```typescript
	 * logger.warn('Deprecated API used', { apiName: 'oldEndpoint' }, 'api-client');
	 * ```
	 */
	warn(message: string, data?: unknown, source?: string) {
		const entry = this.createLogEntry('warn', message, data, source);
		this.addLog(entry);

		if (this.isDevelopment) {
			console.warn(`[WARN] ${entry.timestamp} - ${message}`, data || '');
		}
	}

	/**
	 * Logs an error message
	 * @param message - Error message
	 * @param data - Optional additional data to log
	 * @param source - Optional source identifier
	 * @param errorInfo - React error boundary information
	 * @example
	 * ```typescript
	 * try {
	 *   await riskyOperation();
	 * } catch (error) {
	 *   logger.error('Operation failed', error, 'data-service');
	 * }
	 * ```
	 */
	error(message: string, data?: unknown, source?: string, errorInfo?: React.ErrorInfo) {
		const entry = this.createLogEntry('error', message, data, source, errorInfo);
		this.addLog(entry);

		if (errorInfo) {
			console.error(`[ERROR] ${entry.timestamp} - ${message}`, data || '', errorInfo);
		} else {
			console.error(`[ERROR] ${entry.timestamp} - ${message}`, data || '');
		}
	}

	/**
	 * Logs performance timing information
	 * @param operation - Name of the operation being timed
	 * @param duration - Duration in milliseconds
	 * @param data - Optional additional performance data
	 * @example
	 * ```typescript
	 * const start = performance.now();
	 * await heavyComputation();
	 * const duration = performance.now() - start;
	 * logger.perf('data-computation', duration, { itemsProcessed: 1000 });
	 * ```
	 */
	perf(operation: string, duration: number, data?: object) {
		this.info(`Performance: ${operation}`, {
			duration: `${duration.toFixed(2)}ms`,
			...data
		}, 'performance');
	}

	/**
	 * Retrieves comprehensive performance and usage statistics
	 * @returns Performance statistics object
	 * @example
	 * ```typescript
	 * const stats = logger.getPerformanceStats();
	 * console.log(`Total errors: ${stats.logsByLevel.error}`);
	 * console.log(`Average memory: ${stats.averageMemoryUsage.toFixed(1)}MB`);
	 * ```
	 */
	getPerformanceStats(): PerformanceStats {
		const logsByLevel: Record<LogLevel, number> = {
			debug: 0,
			info: 0,
			warn: 0,
			error: 0
		};

		let totalMemory = 0;
		let peakMemory = 0;
		let lastLogTime = this.sessionStartTime;

		this.logs.forEach(log => {
			logsByLevel[log.level]++;
			if (log.memoryUsage) {
				totalMemory += log.memoryUsage;
				peakMemory = Math.max(peakMemory, log.memoryUsage);
			}
			const logTime = new Date(log.timestamp).getTime();
			lastLogTime = Math.max(lastLogTime, logTime);
		});

		return {
			totalLogs: this.logs.length,
			logsByLevel,
			averageMemoryUsage: this.logs.length > 0 ? totalMemory / this.logs.length : 0,
			peakMemoryUsage: peakMemory,
			sessionStartTime: this.sessionStartTime,
			lastLogTime
		};
	}

	/**
	 * Retrieves logs with optional filtering
	 * @param level - Filter by log level
	 * @param source - Filter by source identifier
	 * @returns Array of filtered log entries
	 * @example
	 * ```typescript
	 * // Get all error logs
	 * const errors = logger.getLogs('error');
	 *
	 * // Get all logs from a specific component
	 * const componentLogs = logger.getLogs(undefined, 'UserProfile');
	 *
	 * // Get error logs from a specific source
	 * const apiErrors = logger.getLogs('error', 'api-client');
	 * ```
	 */
	getLogs(level?: LogLevel, source?: string): LogEntry[] {
		let filtered = [...this.logs];

		if (level) {
			filtered = filtered.filter(log => log.level === level);
		}

		if (source) {
			filtered = filtered.filter(log => log.source === source);
		}

		return filtered;
	}

	/**
	 * Clears all stored log entries
	 * @example
	 * ```typescript
	 * // Clear logs after exporting or when starting a new test
	 * const exportData = logger.exportLogs();
	 * logger.clearLogs();
	 * ```
	 */
	clearLogs() {
		this.logs = [];
	}

	/**
	 * Exports all logs and statistics as a JSON string
	 * @returns JSON string containing logs and performance statistics
	 * @example
	 * ```typescript
	 * // Export logs for debugging or analysis
	 * const logData = logger.exportLogs();
	 *
	 * // Save to file or send to logging service
	 * downloadFile('app-logs.json', logData);
	 * ```
	 */
	exportLogs(): string {
		const stats = this.getPerformanceStats();
		return JSON.stringify({
			stats,
			logs: this.logs
		}, null, 2);
	}

	/**
	 * Generates a concise summary of logging session for quick debugging
	 * @returns Formatted summary string with key metrics
	 * @example
	 * ```typescript
	 * // Quick health check
	 * console.log(logger.getSummary());
	 * // Output: "Logger Summary: Total Logs: 45, Session Duration: 120.5s, ..."
	 * ```
	 */
	getSummary(): string {
		const stats = this.getPerformanceStats();
		const sessionDuration = ((performance.now() - this.sessionStartTime) / 1000).toFixed(1);

		return `Logger Summary:
Total Logs: ${stats.totalLogs}
Session Duration: ${sessionDuration}s
Memory: ${stats.averageMemoryUsage.toFixed(1)}MB avg, ${stats.peakMemoryUsage.toFixed(1)}MB peak
Errors: ${stats.logsByLevel.error}, Warnings: ${stats.logsByLevel.warn}`;
	}
}

/**
 * Global logger instance
 *
 * Use this singleton instance throughout your application for consistent logging.
 *
 * @example
 * ```typescript
 * import { logger } from './logger';
 *
 * // In a React component
 * function MyComponent() {
 *   useEffect(() => {
 *     logger.info('Component mounted', undefined, 'MyComponent');
 *     return () => logger.info('Component unmounted', undefined, 'MyComponent');
 *   }, []);
 *
 *   const handleClick = () => {
 *     logger.startTimer('button-click');
 *     doSomething();
 *     logger.endTimer('button-click', 'Button click handled');
 *   };
 * }
 *
 * // In an async function
 * async function fetchUserData(id: string) {
 *   logger.startTimer('fetch-user');
 *   try {
 *     const user = await api.getUser(id);
 *     logger.endTimer('fetch-user', 'User data fetched successfully');
 *     return user;
 *   } catch (error) {
 *     logger.error('Failed to fetch user data', { userId: id, error }, 'user-service');
 *     throw error;
 *   }
 * }
 * ```
 */
export const logger = new Logger();

export type { LogLevel, LogEntry, PerformanceStats };
