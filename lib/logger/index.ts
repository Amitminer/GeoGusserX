import React from 'react';

// Conditional imports for Node.js environment
let fs: typeof import('fs').promises | null = null;
let path: typeof import('path') | null = null;

if (typeof window === 'undefined') {
	try {
		// Use dynamic imports for Node.js modules
		import('fs').then(fsModule => {
			fs = fsModule.promises;
		});
		import('path').then(pathModule => {
			path = pathModule;
		});
	} catch {
		// File system modules not available
		console.warn('File system modules not available for logging');
	}
}

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

	/** Path to the log file */
	private logFilePath = path ? path.join(process.cwd(), 'logger.logs') : 'logger.logs';

	/** Whether we're running in a Node.js environment (server-side) */
	private isServerSide = typeof window === 'undefined';

	/** Queue for pending file writes to avoid race conditions */
	private writeQueue: Promise<void> = Promise.resolve();

	/** Debug message throttling */
	private debugThrottle = new Map<string, number>();
	private debugThrottleInterval = 5000; // 5 seconds

	/**
	 * Gets current memory usage in MB
	 */
	private getMemoryUsage(): number {
		// @ts-expect-error - performance.memory might not be available in all browsers
		return (performance.memory?.usedJSHeapSize || 0) / 1024 / 1024; // MB
	}

	/**
	 * Creates a new log entry with current timestamp and memory usage
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
	 * Writes a log entry to the file system (server-side only)
	 */
	private async writeLogToFile(entry: LogEntry): Promise<void> {
		if (!this.isServerSide || !fs) {
			return; // Skip file writing on client-side or if fs is not available
		}

		try {
			// Format log entry for file output
			const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.source ? ` [${entry.source}]` : ''} ${entry.message}${entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : ''}${entry.duration ? ` | Duration: ${entry.duration.toFixed(2)}ms` : ''}${entry.memoryUsage ? ` | Memory: ${entry.memoryUsage.toFixed(2)}MB` : ''}${entry.errorInfo ? ` | ErrorInfo: ${JSON.stringify(entry.errorInfo)}` : ''}\n`;

			// Queue the write operation to avoid race conditions
			this.writeQueue = this.writeQueue.then(async () => {
				if (fs) {
					await fs.appendFile(this.logFilePath, logLine, 'utf8');
				}
			}).catch((error) => {
				// Fallback to console if file writing fails
				console.error('Failed to write log to file:', error);
			});
		} catch (error) {
			// Silent fail - don't let logging errors break the application
			console.error('Error in writeLogToFile:', error);
		}
	}

	/**
	 * Adds a log entry to the internal storage and writes to file
	 */
	private addLog(entry: LogEntry) {
		this.logs.push(entry);
		if (this.logs.length > this.maxLogs) {
			this.logs.shift();
		}

		// Write to file asynchronously (server-side only)
		this.writeLogToFile(entry);
	}

	/**
	 * Check if a debug message should be throttled
	 */
	private shouldThrottleDebug(message: string, source?: string): boolean {
		const key = `${source || 'default'}:${message}`;
		const now = Date.now();
		const lastLogged = this.debugThrottle.get(key);

		if (!lastLogged || now - lastLogged > this.debugThrottleInterval) {
			this.debugThrottle.set(key, now);
			return false;
		}

		return true;
	}

	/**
	 * Starts a performance timer with the given name
	 */
	startTimer(name: string) {
		this.performanceTimers.set(name, performance.now());
	}

	/**
	 * Ends a performance timer and optionally logs the duration
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
	 * Logs a debug message (only shown in development and throttled)
	 */
	debug(message: string, data?: unknown, source?: string) {
		// Throttle debug messages to prevent spam
		if (this.shouldThrottleDebug(message, source)) {
			return;
		}

		const entry = this.createLogEntry('debug', message, data, source);
		this.addLog(entry);

		// Only show debug logs in development
		if (this.isDevelopment) {
			// Reduce console noise for Street View failures
			if (message.includes('Street View not available') || message.includes('Using random search radius')) {
				// Only log every 5th occurrence
				const key = `${source || 'default'}:${message}`;
				const count = (this.debugThrottle.get(key + ':count') || 0) + 1;
				this.debugThrottle.set(key + ':count', count);
				
				if (count % 5 === 0) {
					console.debug(`[DEBUG] ${entry.timestamp} - ${message} (${count} occurrences)`, data || '');
				}
			} else {
				console.debug(`[DEBUG] ${entry.timestamp} - ${message}`, data || '');
			}
		}
	}

	/**
	 * Logs an informational message
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
	 */
	perf(operation: string, duration: number, data?: object) {
		this.info(`Performance: ${operation}`, {
			duration: `${duration.toFixed(2)}ms`,
			...data
		}, 'performance');
	}

	/**
	 * Retrieves comprehensive performance and usage statistics
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
	 */
	clearLogs() {
		this.logs = [];
		this.debugThrottle.clear();
	}

	/**
	 * Exports all logs and statistics as a JSON string
	 */
	exportLogs(): string {
		const stats = this.getPerformanceStats();
		return JSON.stringify({
			stats,
			logs: this.logs
		}, null, 2);
	}

	/**
	 * Clears the log file (server-side only)
	 */
	async clearLogFile(): Promise<void> {
		if (!this.isServerSide || !fs) {
			return;
		}

		try {
			// Wait for any pending writes to complete
			await this.writeQueue;
			// Clear the file
			if (fs) {
				await fs.writeFile(this.logFilePath, '', 'utf8');
			}
		} catch (error) {
			console.error('Failed to clear log file:', error);
		}
	}

	/**
	 * Reads the entire log file content (server-side only)
	 */
	async readLogFile(): Promise<string> {
		if (!this.isServerSide || !fs) {
			return '';
		}

		try {
			// Wait for any pending writes to complete
			await this.writeQueue;
			if (fs) {
				return await fs.readFile(this.logFilePath, 'utf8');
			}
			return '';
		} catch {
			// File might not exist yet, return empty string
			return '';
		}
	}

	/**
	 * Gets the log file path
	 */
	getLogFilePath(): string {
		return this.logFilePath;
	}

	/**
	 * Checks if file logging is available (server-side only)
	 */
	isFileLoggingAvailable(): boolean {
		return this.isServerSide && fs !== null;
	}

	/**
	 * Flushes any pending log writes to ensure they are written to disk
	 */
	async flushLogs(): Promise<void> {
		if (!this.isServerSide || !fs) {
			return;
		}

		try {
			await this.writeQueue;
		} catch (error) {
			console.error('Error flushing logs:', error);
		}
	}

	/**
	 * Generates a concise summary of logging session for quick debugging
	 */
	getSummary(): string {
		const stats = this.getPerformanceStats();
		const sessionDuration = ((performance.now() - this.sessionStartTime) / 1000).toFixed(1);

		return `Logger Summary:
Total Logs: ${stats.totalLogs}
Session Duration: ${sessionDuration}s
Memory: ${stats.averageMemoryUsage.toFixed(1)}MB avg, ${stats.peakMemoryUsage.toFixed(1)}MB peak
Errors: ${stats.logsByLevel.error}, Warnings: ${stats.logsByLevel.warn}
File Logging: ${this.isFileLoggingAvailable() ? 'Enabled' : 'Disabled'}
Log File: ${this.logFilePath}`;
	}
}

/**
 * Global logger instance
 */
export const logger = new Logger();

export type { LogLevel, LogEntry, PerformanceStats };