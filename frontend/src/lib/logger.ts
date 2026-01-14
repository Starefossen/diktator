/**
 * Centralized logging utility for Diktator
 *
 * Features:
 * - Namespaced logging (e.g., [OIDC], [SW], [Audio])
 * - Log levels (debug, info, warn, error)
 * - Production defaults: only warn/error shown
 * - Debug mode toggle via localStorage: localStorage.setItem('diktator_debug', 'true')
 * - Extensible for future remote logging integration
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface _LoggerOptions {
  namespace: string;
}

interface ReloadTrackingData {
  timestamp: string;
  reason: string;
  userInitiated: boolean;
}

// Check if debug mode is enabled via localStorage
const isDebugEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("diktator_debug") === "true";
};

// Check if we're in production
const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

// Determine if a log level should be shown
const shouldLog = (_level: LogLevel): boolean => {
  // Always show warnings and errors
  if (_level === "warn" || _level === "error") return true;

  // In development, show all logs
  if (!isProduction()) return true;

  // In production, only show debug/info if explicitly enabled
  return isDebugEnabled();
};

// Format the log prefix
const formatPrefix = (namespace: string, _level: LogLevel): string => {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
  return `[${timestamp}] [${namespace}]`;
};

// Create a logger for a specific namespace
const createLogger = (namespace: string) => {
  return {
    debug: (...args: unknown[]) => {
      if (shouldLog("debug")) {
        console.log(formatPrefix(namespace, "debug"), ...args);
      }
    },
    info: (...args: unknown[]) => {
      if (shouldLog("info")) {
        console.log(formatPrefix(namespace, "info"), ...args);
      }
    },
    warn: (...args: unknown[]) => {
      if (shouldLog("warn")) {
        console.warn(formatPrefix(namespace, "warn"), ...args);
      }
    },
    error: (...args: unknown[]) => {
      if (shouldLog("error")) {
        console.error(formatPrefix(namespace, "error"), ...args);
      }
    },
  };
};

// Pre-configured loggers for common namespaces
export const logger = {
  oidc: createLogger("OIDC"),
  sw: createLogger("SW"),
  auth: createLogger("Auth"),
  api: createLogger("API"),
  audio: createLogger("Audio"),
  tts: createLogger("TTS"),
};

// Track page reload events for debugging
export const trackReload = (reason: string, userInitiated: boolean): void => {
  if (typeof window === "undefined") return;

  const data: ReloadTrackingData = {
    timestamp: new Date().toISOString(),
    reason,
    userInitiated,
  };

  localStorage.setItem("diktator_last_reload", JSON.stringify(data));
  logger.sw.info("Tracking reload:", data);
};

// Get last reload info
const _getLastReload = (): ReloadTrackingData | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("diktator_last_reload");
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ReloadTrackingData;
  } catch {
    return null;
  }
};

// Export for creating custom loggers
