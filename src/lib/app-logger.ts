import {
  getStorageItem,
  setStorageItem,
  STORAGE_KEYS,
  type AppLogEntry,
} from "@/lib/storage";

export type AppLogLevel = "debug" | "info" | "warn" | "error";

export type AppLogContext = {
  scope: string;
  message: string;
  data?: Record<string, unknown>;
};

const MAX_LOG_ENTRIES = 150;
const MAX_STRING_LENGTH = 280;
const MAX_DEPTH = 4;

const SENSITIVE_KEYS = new Set([
  "token",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "authorizationcode",
  "authorization_code",
  "identitytoken",
  "identity_token",
  "nonce",
  "password",
  "secret",
  "email",
]);

function createLogId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function truncateLogString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}...`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function sanitizeLogData(value: unknown, depth: number = 0): unknown {
  if (depth > MAX_DEPTH) return "[truncated]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return truncateLogString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateLogString(value.message),
    };
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeLogData(entry, depth + 1));
  }
  if (!isRecord(value)) return String(value);

  const sanitized: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      sanitized[key] = "[redacted]";
      continue;
    }
    sanitized[key] = sanitizeLogData(entry, depth + 1);
  }
  return sanitized;
}

function sanitizeContextData(
  data: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const sanitized = sanitizeLogData(data);
  if (!isRecord(sanitized)) return undefined;
  if (Object.keys(sanitized).length === 0) return undefined;
  return sanitized;
}

function storeLogEntry(entry: AppLogEntry): void {
  const currentLogs = getStorageItem(STORAGE_KEYS.appLogs) ?? [];
  const nextLogs = [...currentLogs, entry];
  const trimmedLogs = nextLogs.slice(-MAX_LOG_ENTRIES);
  setStorageItem(STORAGE_KEYS.appLogs, trimmedLogs);
}

function sendToConsole(entry: AppLogEntry): void {
  const label = `[${entry.scope}] ${entry.message}`;
  const payload = entry.data;
  if (entry.level === "error") {
    if (payload) console.error(label, payload);
    else console.error(label);
    return;
  }
  if (entry.level === "warn") {
    if (payload) console.warn(label, payload);
    else console.warn(label);
    return;
  }
  if (entry.level === "debug") {
    if (payload) console.log(label, payload);
    else console.log(label);
    return;
  }
  if (payload) console.log(label, payload);
  else console.log(label);
}

function buildLogEntry(
  level: AppLogLevel,
  context: AppLogContext
): AppLogEntry {
  return {
    id: createLogId(),
    level,
    scope: context.scope,
    message: context.message,
    data: sanitizeContextData(context.data),
    createdAt: Date.now(),
  };
}

export function logEvent(level: AppLogLevel, context: AppLogContext): void {
  const entry = buildLogEntry(level, context);
  sendToConsole(entry);
  storeLogEntry(entry);
}

export function logDebug(context: AppLogContext): void {
  logEvent("debug", context);
}

export function logInfo(context: AppLogContext): void {
  logEvent("info", context);
}

export function logWarn(context: AppLogContext): void {
  logEvent("warn", context);
}

export function logError(context: AppLogContext): void {
  logEvent("error", context);
}

export function getAppLogs(): AppLogEntry[] {
  return getStorageItem(STORAGE_KEYS.appLogs) ?? [];
}

export function clearAppLogs(): void {
  setStorageItem(STORAGE_KEYS.appLogs, null);
}

export function getErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: truncateLogString(error.message),
    };
  }
  if (isRecord(error)) {
    const codeValue =
      "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
    const messageValue =
      "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : String(error);
    return {
      code: codeValue || undefined,
      message: truncateLogString(messageValue),
    };
  }
  return { message: truncateLogString(String(error)) };
}
