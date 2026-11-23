// src/lib/auth/local-lock.ts
//
// Pure client-side local authentication and lock protection.
// Allows users to set a master password/PIN stored safely on device (PBKDF2 + SHA-256)
// and unlock Budget Boss completely offline without relying on Convex cloud servers.

import { claimLocalDataOwner } from '../db/data-owner';

// One versioned blob replaces the old split salt/hash keys: a failure between
// two setItem calls used to leave a lock that could never be unlocked (N8).
const LOCAL_LOCK_BLOB_KEY = 'bb:localLock';
const LOCAL_LOCK_SALT_KEY = 'bb:localLockSalt'; // legacy, read-only
const LOCAL_LOCK_HASH_KEY = 'bb:localLockHash'; // legacy, read-only
const LOCAL_LOCK_FAILURES_KEY = 'bb:localLockFailures';
const LOCAL_SESSION_KEY = 'bb:localSessionActive';
const LOCAL_OWNER_ID_KEY = 'bb:localOwnerId';
const LOCAL_MODE_PREF_KEY = 'bb:localModePreferred';

const LOCK_VERSION = 1;
/** OWASP-recommended iteration count for NEW locks. */
const LOCK_ITERATIONS = 600_000;
/** Pre-hardening locks used 100k; verify them, then rehash on unlock. */
const LEGACY_ITERATIONS = 100_000;
const MIN_LOCK_ITERATIONS = 100_000;
const MAX_LOCK_ITERATIONS = 2_000_000;
const MAX_FAILED_ATTEMPTS = 3;
const BASE_COOLDOWN_MS = 1_000;
const MAX_COOLDOWN_MS = 60_000;

interface LockBlob {
  version: number;
  salt: string;
  hash: string;
  iterations: number;
}

interface LockFailures {
  count: number;
  until: number;
}

export interface LocalLockState {
  hasLock: boolean;
  isUnlocked: boolean;
  ownerId: string | null;
}

// --- Safe storage access (C5: strict WebViews throw SecurityError) ---------
function safeGet(kind: 'local' | 'session', key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return (kind === 'local' ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

/** Returns an error message on failure, or null on success. */
function safeSet(kind: 'local' | 'session', key: string, value: string): string | null {
  try {
    if (typeof window === 'undefined') return 'window unavailable';
    (kind === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

function safeRemove(kind: 'local' | 'session', key: string): void {
  try {
    if (typeof window === 'undefined') return;
    (kind === 'local' ? window.localStorage : window.sessionStorage).removeItem(key);
  } catch {
    // best-effort only
  }
}

/**
 * Returns true if the user has chosen to use the app in offline / local-only mode.
 */
export function isLocalModePreferred(): boolean {
  return safeGet('local', LOCAL_MODE_PREF_KEY) === 'true';
}

/**
 * Persists the user preference to run in local-only / offline vault mode.
 */
export function setLocalModePreferred(preferred: boolean): void {
  if (typeof window === 'undefined') return;
  if (preferred) {
    safeSet('local', LOCAL_MODE_PREF_KEY, 'true');
  } else {
    safeRemove('local', LOCAL_MODE_PREF_KEY);
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/**
 * Derives a PBKDF2 hash from a master password and salt.
 */
async function hashPassword(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not available');
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bytesToHex(new Uint8Array(derivedBits));
}

function readBlob(): LockBlob | null {
  const raw = safeGet('local', LOCAL_LOCK_BLOB_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LockBlob>;
    if (parsed.version !== LOCK_VERSION) return null;
    if (typeof parsed.salt !== 'string' || typeof parsed.hash !== 'string') return null;
    const iterations = typeof parsed.iterations === 'number' ? parsed.iterations : LEGACY_ITERATIONS;
    if (!Number.isFinite(iterations) || iterations < MIN_LOCK_ITERATIONS || iterations > MAX_LOCK_ITERATIONS) return null;
    return { version: LOCK_VERSION, salt: parsed.salt, hash: parsed.hash, iterations };
  } catch {
    return null;
  }
}

/** Back-compatibility with the old split localStorage keys (100k PBKDF2). */
function readLegacyLock(): LockBlob | null {
  const salt = safeGet('local', LOCAL_LOCK_SALT_KEY);
  const hash = safeGet('local', LOCAL_LOCK_HASH_KEY);
  if (!salt || !hash) return null;
  return { version: LOCK_VERSION, salt, hash, iterations: LEGACY_ITERATIONS };
}

function readFailures(): LockFailures {
  const raw = safeGet('local', LOCAL_LOCK_FAILURES_KEY);
  if (!raw) return { count: 0, until: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<LockFailures>;
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      until: typeof parsed.until === 'number' ? parsed.until : 0,
    };
  } catch {
    return { count: 0, until: 0 };
  }
}

function clearFailures(): void {
  safeRemove('local', LOCAL_LOCK_FAILURES_KEY);
}

function recordFailure(previous: LockFailures): void {
  const count = previous.count + 1;
  // A single typo must not lock the user out; throttling starts only after
  // MAX_FAILED_ATTEMPTS consecutive failures, then backs off exponentially.
  const delay = count >= MAX_FAILED_ATTEMPTS
    ? Math.min(MAX_COOLDOWN_MS, BASE_COOLDOWN_MS * 2 ** (count - MAX_FAILED_ATTEMPTS))
    : 0;
  safeSet('local', LOCAL_LOCK_FAILURES_KEY, JSON.stringify({
    count,
    until: delay > 0 ? Date.now() + delay : 0,
  }));
}

/**
 * Checks if a master password has been set up on this device.
 */
export function hasLocalPassword(): boolean {
  if (typeof window === 'undefined') return false;
  return readBlob() !== null || readLegacyLock() !== null;
}

/**
 * Checks if the current local session is unlocked.
 */
export function isLocalUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  // If no password is configured, the local database is unlocked by default.
  if (!hasLocalPassword()) return true;
  return safeGet('session', LOCAL_SESSION_KEY) === 'unlocked';
}

/**
 * Returns the stable local owner ID (or creates one if not present).
 */
export function getOrCreateLocalOwnerId(): string {
  if (typeof window === 'undefined') return 'local-user';
  let id = safeGet('local', LOCAL_OWNER_ID_KEY);
  if (!id) {
    id = `local:${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
    safeSet('local', LOCAL_OWNER_ID_KEY, id);
  }
  return id;
}

/**
 * Configures or changes the master password for the local device.
 */
export async function setLocalPassword(password: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!password || password.length === 0) {
    throw new Error('Password required for local lock');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt, LOCK_ITERATIONS);
  const blob: LockBlob = {
    version: LOCK_VERSION,
    salt: bytesToHex(salt),
    hash,
    iterations: LOCK_ITERATIONS,
  };

  const writeError = safeSet('local', LOCAL_LOCK_BLOB_KEY, JSON.stringify(blob));
  if (writeError) {
    // N8: never leave a half-written lock (e.g. salt updated, hash write
    // failed). Drop the whole blob and leave the device unlocked instead of
    // permanently locked out.
    safeRemove('local', LOCAL_LOCK_BLOB_KEY);
    safeRemove('local', LOCAL_LOCK_SALT_KEY);
    safeRemove('local', LOCAL_LOCK_HASH_KEY);
    clearFailures();
    safeSet('session', LOCAL_SESSION_KEY, 'unlocked');
    throw new Error(`Failed to persist local lock: ${writeError}`);
  }
  safeRemove('local', LOCAL_LOCK_SALT_KEY);
  safeRemove('local', LOCAL_LOCK_HASH_KEY);
  clearFailures();
  safeSet('session', LOCAL_SESSION_KEY, 'unlocked');

  // Claim local database owner
  const ownerId = getOrCreateLocalOwnerId();
  try {
    await claimLocalDataOwner(ownerId);
  } catch (err) {
    console.warn('[LocalLock] owner claim failed:', err);
  }
}

/**
 * Verifies the master password and unlocks the session.
 */
export async function unlockLocalVault(password: string): Promise<boolean> {
  if (typeof window === 'undefined' || !password || password.length === 0) return false;

  // N8: persisted failure counter with exponential cooldown.
  const failures = readFailures();
  if (failures.until > Date.now()) return false;

  const blob = readBlob() ?? readLegacyLock();
  if (!blob) {
    // If no password set, mark as unlocked
    safeSet('session', LOCAL_SESSION_KEY, 'unlocked');
    return true;
  }

  const salt = hexToBytes(blob.salt);
  if (!salt || salt.length < 16) return false;

  const computedHash = await hashPassword(password, salt, blob.iterations);
  if (computedHash !== blob.hash) {
    recordFailure(failures);
    return false;
  }

  // Back-compat: rehash a legacy 100k lock at 600k once it is successfully
  // unlocked, and collapse the old split keys into the single new blob.
  if (blob.iterations < LOCK_ITERATIONS || readBlob() === null) {
    const newSalt = window.crypto.getRandomValues(new Uint8Array(16));
    const newHash = await hashPassword(password, newSalt, LOCK_ITERATIONS);
    safeSet('local', LOCAL_LOCK_BLOB_KEY, JSON.stringify({
      version: LOCK_VERSION,
      salt: bytesToHex(newSalt),
      hash: newHash,
      iterations: LOCK_ITERATIONS,
    } satisfies LockBlob));
  }
  safeRemove('local', LOCAL_LOCK_SALT_KEY);
  safeRemove('local', LOCAL_LOCK_HASH_KEY);
  clearFailures();
  safeSet('session', LOCAL_SESSION_KEY, 'unlocked');
  const ownerId = getOrCreateLocalOwnerId();
  try {
    await claimLocalDataOwner(ownerId);
  } catch (err) {
    console.warn('[LocalLock] owner claim failed:', err);
  }
  return true;
}

/**
 * Locks the current local session.
 */
export function lockLocalVault(): void {
  if (typeof window === 'undefined') return;
  safeRemove('session', LOCAL_SESSION_KEY);
}

/**
 * Removes the master password lock, leaving the app accessible without a password.
 */
export function removeLocalPassword(): void {
  if (typeof window === 'undefined') return;
  safeRemove('local', LOCAL_LOCK_BLOB_KEY);
  safeRemove('local', LOCAL_LOCK_SALT_KEY);
  safeRemove('local', LOCAL_LOCK_HASH_KEY);
  clearFailures();
  safeSet('session', LOCAL_SESSION_KEY, 'unlocked');
}
