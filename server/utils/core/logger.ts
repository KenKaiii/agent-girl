/**
 * Structured Logger
 * Replaces console.log with structured, contextual logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogContext {
  sessionId?: string;
  requestId?: string;
  userId?: string;
  action?: string;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

class Logger {
  private minLevel: LogLevel;
  private isDev: boolean;

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.isDev = process.env.NODE_ENV !== 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private formatEntry(entry: LogEntry): string {
    if (this.isDev) {
      // Pretty format for development
      const timestamp = new Date(entry.timestamp).toLocaleTimeString();
      const levelColors: Record<LogLevel, string> = {
        debug: '\x1b[90m',  // Gray
        info: '\x1b[36m',   // Cyan
        warn: '\x1b[33m',   // Yellow
        error: '\x1b[31m',  // Red
        fatal: '\x1b[35m',  // Magenta
      };
      const reset = '\x1b[0m';
      const color = levelColors[entry.level];

      let output = `${color}[${timestamp}] ${entry.level.toUpperCase().padEnd(5)}${reset} ${entry.message}`;

      if (entry.context && Object.keys(entry.context).length > 0) {
        const ctx = Object.entries(entry.context)
          .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
          .join(' ');
        output += ` ${'\x1b[90m'}${ctx}${reset}`;
      }

      if (entry.error) {
        output += `\n  ${'\x1b[31m'}${entry.error.name}: ${entry.error.message}${reset}`;
        if (entry.error.stack && this.isDev) {
          output += `\n${entry.error.stack.split('\n').slice(1).join('\n')}`;
        }
      }

      return output;
    }

    // JSON format for production
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    const formatted = this.formatEntry(entry);

    if (level === 'error' || level === 'fatal') {
      console.error(formatted);
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log('error', message, context, error);
  }

  fatal(message: string, context?: LogContext, error?: Error): void {
    this.log('fatal', message, context, error);
  }

  /**
   * Create a child logger with preset context
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }

  /**
   * Time an async operation
   */
  async time<T>(
    name: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = Math.round(performance.now() - start);
      this.debug(`${name} completed`, { ...context, duration });
      return result;
    } catch (error) {
      const duration = Math.round(performance.now() - start);
      this.error(`${name} failed`, { ...context, duration }, error as Error);
      throw error;
    }
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.parent.warn(message, this.mergeContext(context), error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.parent.error(message, this.mergeContext(context), error);
  }

  fatal(message: string, context?: LogContext, error?: Error): void {
    this.parent.fatal(message, this.mergeContext(context), error);
  }
}

// Singleton logger instance
export const logger = new Logger();

// Export types
export type { LogLevel, LogContext, LogEntry };
