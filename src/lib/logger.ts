export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  problemId?: string;
  event?: string;
  latencyMs?: number;
  [key: string]: unknown;
}

class Logger {
  private isDev = process.env.NODE_ENV !== "production";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...context,
    };

    if (this.isDev) {
      const meta = context ? ` ${JSON.stringify(context)}` : "";
      return `[${timestamp}] [${level.toUpperCase()}] ${message}${meta}`;
    }

    return JSON.stringify(payload);
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage("info", message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatMessage("error", message, context));
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }
}

export const logger = new Logger();
