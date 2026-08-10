// lib/utils/action-logger.ts
'use client';

const MAX_LOGS = 20;
const STORAGE_KEY = 'bb:user-action-logs';

let memoryLogs: string[] = [];

function loadLogs(): string[] {
  if (typeof window === 'undefined') return memoryLogs;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(-MAX_LOGS);
    }
  } catch {
    // Ignore storage errors
  }
  return memoryLogs;
}

function saveLogs(logs: string[]): void {
  memoryLogs = logs.slice(-MAX_LOGS);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memoryLogs));
    } catch {
      // Ignore storage errors
    }
  }
}

/**
 * Log a user action or feature process (keeps the last 20 actions).
 * @param action Description of the user action or process event
 */
export function logUserAction(action: string): void {
  const timestamp = new Date().toISOString().slice(11, 19); // HH:mm:ss
  const entry = `[${timestamp}] ${action}`;
  const current = loadLogs();
  const updated = [...current, entry].slice(-MAX_LOGS);
  saveLogs(updated);
}

/**
 * Retrieve the current buffer of the last 20 user action logs.
 */
export function getUserActionLogs(): string[] {
  return loadLogs();
}

/**
 * Clear the action logs buffer (testing helper).
 */
export function clearUserActionLogs(): void {
  memoryLogs = [];
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}
