import React from 'react';

// Conditional imports for Node.js environment
let fs: typeof import('fs').promises | null = null;
let path: typeof import('path') | null = null;

if (typeof window === 'undefined') {
	try {
		// Use dynamic imports for Node.js modules to avoid breaking client-side builds.
		import('fs').then(fsModule => {
			fs = fsModule.promises;
		});
		import('path').then(pathModule => {
			path = pathModule;
		});
	} catch {
		// File system modules are not available in all environments (e.g., Vercel Edge Functions).
		console.warn('File system modules not available for logging');
	}
}

/**
 * Defines the available log levels in order of increasing severity.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Represents a single log entry, containing the message and associated metadata.
 */
interface LogEntry {
	/** The ISO 8601 timestamp indicating when the log was created. */
	timestamp: string;
	/** The severity level of the log entry. */
	level: LogLevel;
	/** The main log message. */
	message: string;
	/** Optional structured data to provide additional context. */
	data?: unknown;
	/** An optional identifier for the source of the log (e.g., a component or module name). */
	source?: string;
	/** React-specific error information, captured by an error boundary. */
	errorInfo?: React.ErrorInfo;
	/** The duration of a performance measurement, in milliseconds. */
	duration?: number;
	/** The memory usage at the time of logging, in megabytes. */
	memoryUsage?: number;
}

/**
 * Contains performance and usage statistics for the current logging session.
 */
interface PerformanceStats {
	/** The total number of logs recorded since the logger was initialized. */
	totalLogs: number;
	/** A breakdown of log counts by their severity level. */
	logsByLevel: Record<LogLevel, number>;
	/** The average memory usage recorded across all log entries, in megabytes. */
	averageMemoryUsage: number;
	/** The peak memory usage recorded during the session, in megabytes. */
	peakMemoryUsage: number;
	/** The timestamp when the logging session started. */
	sessionStartTime: number;
	/** The timestamp of the most recent log entry. */
	lastLogTime: number;
}

/**
 * A comprehensive logging utility that includes performance monitoring, memory tracking,
 * log level management, and server-side file logging. It is designed to be environment-aware,
 * only enabling file-based logging in a Node.js environment.
 */
class Logger {
	private isDevelopment = process.env.NODE_ENV === 'development';
	private logs: LogEntry[] = [];
	private maxLogs = 1000; // In-memory circular buffer for logs.
	private sessionStartTime = performance.now();
	private performanceTimers = new Map<string, number>();
	private logFilePath = path ? path.join(process.cwd(), 'logger.logs') : 'logger.logs';
	private isServerSide = typeof window === 'undefined';
	private writeQueue: Promise<void> = Promise.resolve(); // Serializes file writes to prevent race conditions.
	private debugThrottle = new Map<string, number>();
	private debugThrottleInterval = 5000; // 5 seconds

	/**
	 * Retrieves the current memory usage in megabytes, if available.
	 * @returns The used JavaScript heap size in MB.
	 */
	private getMemoryUsage(): number {
		// @ts-expect-error - `performance.memory` is a non-standard feature.
		return (performance.memory?.usedJSHeapSize || 0) / 1024 / 1024; // MB
	}

	/**
	 * Creates a new log entry object with a timestamp and current memory usage.
	 * @returns A `LogEntry` object.
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
	 * Asynchronously writes a log entry to the file system on the server side.
	 * This method uses a write queue to ensure that log messages are written sequentially,
	 * preventing race conditions and corrupted log files.
	 * @param entry The `LogEntry` to write.
	 */
	private async writeLogToFile(entry: LogEntry): Promise<void> {
		if (!this.isServerSide || !fs) {
			return;
		}

		try {
			const logLine = `[${entry.timestamp}] [${entry.level.toUpperCase()}]${entry.source ? ` [${entry.source}]` : ''} ${entry.message}${entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : ''}${entry.duration ? ` | Duration: ${entry.duration.toFixed(2)}ms` : ''}${entry.memoryUsage ? ` | Memory: ${entry.memoryUsage.toFixed(2)}MB` : ''}${entry.errorInfo ? ` | ErrorInfo: ${JSON.stringify(entry.errorInfo)}` : ''}\n`;

			this.writeQueue = this.writeQueue.then(async () => {
				if (fs) {
					await fs.appendFile(this.logFilePath, logLine, 'utf8');
				}
			}).catch((error) => {
				console.error('Failed to write log to file:', error);
			});
		} catch (error) {
			console.error('Error in writeLogToFile:', error);
		}
	}

	/**
	 * Adds a log entry to the in-memory circular buffer and triggers a file write.
	 * @param entry The `LogEntry` to add.
	 */
	private addLog(entry: LogEntry) {
		this.logs.push(entry);
		if (this.logs.length > this.maxLogs) {
			this.logs.shift(); // Maintain the circular buffer size.
		}

		this.writeLogToFile(entry);
	}

	/**
	 * Checks if a debug message should be throttled to avoid spamming the console.
	 * @param message The log message.
	 * @param source The source of the log.
	 * @returns `true` if the message should be throttled, `false` otherwise.
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
	 * Starts a performance timer with a given name.
	 * @param name A unique name for the timer.
	 */
	startTimer(name: string) {
		this.performanceTimers.set(name, performance.now());
	}

	/**
	 * Ends a performance timer and returns the duration in milliseconds.
	 * Optionally logs the duration as an informational message.
	 * @param name The name of the timer to end.
	 * @param message An optional message to log with the duration.
	 * @returns The duration of the timer in milliseconds.
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
	 * Logs a debug message. These messages are throttled and only appear in development mode.
	 */
	debug(message: string, data?: unknown, source?: string) {
		if (this.shouldThrottleDebug(message, source)) {
			return;
		}

		const entry = this.createLogEntry('debug', message, data, source);
		this.addLog(entry);

		if (this.isDevelopment) {
			// Special handling to reduce console noise for frequent messages.
			if (message.includes('Street View not available') || message.includes('Using random search radius')) {
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
	 * Logs an informational message.
	 */
	info(message: string, data?: unknown, source?: string) {
		const entry = this.createLogEntry('info', message, data, source);
		this.addLog(entry);

		if (this.isDevelopment) {
			console.info(`[INFO] ${entry.timestamp} - ${message}`, data || '');
		}
	}

	/**
	 * Logs a warning message.
	 */
	warn(message: string, data?: unknown, source?: string) {
		const entry = this.createLogEntry('warn', message, data, source);
		this.addLog(entry);

		if (this.isDevelopment) {
			console.warn(`[WARN] ${entry.timestamp} - ${message}`, data || '');
		}
	}

	/**
	 * Logs an error message, with optional React error information.
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
	 * Logs performance timing information for a specific operation.
	 * @param operation A description of the operation being timed.
	 * @param duration The duration of the operation in milliseconds.
	 * @param data Optional additional data to include with the log.
	 */
	perf(operation: string, duration: number, data?: object) {
		this.info(`Performance: ${operation}`, {
			duration: `${duration.toFixed(2)}ms`,
			...data
		}, 'performance');
	}

	/**
	 * Retrieves a summary of performance and usage statistics for the current logging session.
	 * @returns A `PerformanceStats` object.
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
	 * Retrieves the in-memory logs, with optional filtering by level and source.
	 * @param level An optional log level to filter by.
	 * @param source An optional source identifier to filter by.
	 * @returns An array of `LogEntry` objects.
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
	 * Clears all logs from the in-memory buffer.
	 */
	clearLogs() {
		this.logs = [];
		this.debugThrottle.clear();
	}

	/**
	 * Exports all in-memory logs and performance statistics as a JSON string.
	 * @returns A JSON string representing the current state of the logger.
	 */
	exportLogs(): string {
		const stats = this.getPerformanceStats();
		return JSON.stringify({
			stats,
			logs: this.logs
		}, null, 2);
	}

	/**
	 * Clears the log file on the server side.
	 */
	async clearLogFile(): Promise<void> {
		if (!this.isServerSide || !fs) {
			return;
		}

		try {
			await this.writeQueue;
			if (fs) {
				await fs.writeFile(this.logFilePath, '', 'utf8');
			}
		} catch (error) {
			console.error('Failed to clear log file:', error);
		}
	}

	/**
	 * Reads the entire content of the log file on the server side.
	 * @returns A promise that resolves to the content of the log file.
	 */
	async readLogFile(): Promise<string> {
		if (!this.isServerSide || !fs) {
			return '';
		}

		try {
			await this.writeQueue;
			if (fs) {
				return await fs.readFile(this.logFilePath, 'utf8');
			}
			return '';
		} catch {
			return '';
		}
	}

	/**
	 * Returns the absolute path to the log file.
	 */
	getLogFilePath(): string {
		return this.logFilePath;
	}

	/**
	 * Checks if file logging is available in the current environment.
	 * @returns `true` if file logging is available, `false` otherwise.
	 */
	isFileLoggingAvailable(): boolean {
		return this.isServerSide && fs !== null;
	}

	/**
	 * Ensures that any pending log writes are flushed to the disk.
	 * @returns A promise that resolves when the write queue is empty.
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
	 * Generates a concise, human-readable summary of the current logging session.
	 * @returns A string containing the summary.
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
 * The global singleton instance of the `Logger` class.
 */
export const logger = new Logger();

export type { LogLevel, LogEntry, PerformanceStats };
