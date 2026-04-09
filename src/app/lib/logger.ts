/**
 * Logger Utility
 * Provides consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
  error?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLog(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private log(level: LogLevel, service: string, message: string, data?: any, error?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service,
      message,
      ...(data && { data }),
      ...(error && { error: error.message || String(error) }),
    };

    const formattedLog = this.formatLog(logEntry);

    // Log to console in development
    if (this.isDevelopment) {
      const logMethod = level === LogLevel.ERROR ? console.error : level === LogLevel.WARN ? console.warn : console.log;
      logMethod(`[${level}] [${service}] ${message}`, data || error || '');
    } else {
      // In production, you can integrate with external logging services
      // e.g., Sentry, LogRocket, CloudWatch, etc.
      if (level === LogLevel.ERROR) {
        console.error(formattedLog);
      } else {
        console.log(formattedLog);
      }
    }
  }

  debug(service: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, service, message, data);
  }

  info(service: string, message: string, data?: any) {
    this.log(LogLevel.INFO, service, message, data);
  }

  warn(service: string, message: string, data?: any) {
    this.log(LogLevel.WARN, service, message, data);
  }

  error(service: string, message: string, error?: any) {
    this.log(LogLevel.ERROR, service, message, undefined, error);
  }
}

export const logger = new Logger();
