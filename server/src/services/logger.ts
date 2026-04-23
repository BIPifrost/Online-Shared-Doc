type LogLevel = "info" | "warn" | "error";

function formatLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const contextText = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextText}`;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.log(formatLog("info", message, context));
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(formatLog("warn", message, context));
  },
  error(message: string, context?: Record<string, unknown>) {
    console.error(formatLog("error", message, context));
  }
};
