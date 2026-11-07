// src/lib/auth/local-lock.ts
//
// Pure client-side local authentication and lock protection.
// Allows users to set a master password/PIN stored safely on device (PBKDF2 + SHA-256)
// and unlock Budget Boss completely offline without relying on Convex cloud servers.

import { claimLocalDataOwner } from '../db/data-owner';

const LOCAL_LOCK_HASH_KEY = 'bb:localLockHash';
const LOCAL_LOCK_SALT_KEY = 'bb:localLockSalt';
const LOCAL_SESSION_KEY = 'bb:localSessionActive';
const LOCAL_OWNER_ID_KEY = 'bb:localOwnerId';
const LOCAL_MODE_PREF_KEY = 'bb:localModePreferred';

export interface LocalLockState {
  hasLock: boolean;
  isUnlocked: boolean;
  ownerId: string | null;
}

/**
 * Returns true if the user has chosen to use the app in offline / local-only mode.
 */
export function isLocalModePreferred(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LOCAL_MODE_PREF_KEY) === 'true';
}

/**
 * Persists the user preference to run in local-only / offline vault mode.
 */
export function setLocalModePreferred(preferred: boolean): void {
  if (typeof window === 'undefined') return;
  if (preferred) {
    localStorage.setItem(LOCAL_MODE_PREF_KEY, 'true');
  } else {
    localStorage.removeItem(LOCAL_MODE_PREF_KEY);
  }
}

/**
 * Derives a PBKDF2 hash from a master password and salt.
 */
async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
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
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Checks if a master password has been set up on this device.
 */
export function hasLocalPassword(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(LOCAL_LOCK_HASH_KEY));
}

/**
 * Checks if the current local session is unlocked.
 */
export function isLocalUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  // If no password is configured, the local database is unlocked by default.
  if (!hasLocalPassword()) {
    return true;
  }
  return sessionStorage.getItem(LOCAL_SESSION_KEY) === 'unlocked';
}

/**
 * Returns the stable local owner ID (or creates one if not present).
 */
export function getOrCreateLocalOwnerId(): string {
  if (typeof window === 'undefined') return 'local-user';
  let id = localStorage.getItem(LOCAL_OWNER_ID_KEY);
  if (!id) {
    id = `local:${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
    localStorage.setItem(LOCAL_OWNER_ID_KEY, id);
  }
  return id;
}

/**
 * Configures or changes the master password for the local device.
 */
export async function setLocalPassword(password: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hash = await hashPassword(password, salt);

  localStorage.setItem(LOCAL_LOCK_SALT_KEY, saltHex);
  localStorage.setItem(LOCAL_LOCK_HASH_KEY, hash);
  sessionStorage.setItem(LOCAL_SESSION_KEY, 'unlocked');

  // Claim local database owner
  const ownerId = getOrCreateLocalOwnerId();
  await claimLocalDataOwner(ownerId);
}

/**
 * Verifies the master password and unlocks the session.
 */
export async function unlockLocalVault(password: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const storedHash = localStorage.getItem(LOCAL_LOCK_HASH_KEY);
  const storedSaltHex = localStorage.getItem(LOCAL_LOCK_SALT_KEY);

  if (!storedHash) {
    // If no password set, mark as unlocked
    sessionStorage.setItem(LOCAL_SESSION_KEY, 'unlocked');
    return true;
  }

  // If a password was set but the salt is missing, fail closed
  if (!storedSaltHex) {
    return false;
  }

  // Parse salt
  const match = storedSaltHex.match(/.{1,2}/g);
  if (!match) return false;
  const salt = new Uint8Array(match.map((byte) => parseInt(byte, 16)));

  const computedHash = await hashPassword(password, salt);
  if (computedHash === storedHash) {
    sessionStorage.setItem(LOCAL_SESSION_KEY, 'unlocked');
    const ownerId = getOrCreateLocalOwnerId();
    await claimLocalDataOwner(ownerId);
    return true;
  }

  return false;
}

/**
 * Locks the current local session.
 */
export function lockLocalVault(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(LOCAL_SESSION_KEY);
}

/**
 * Removes the master password lock, leaving the app accessible without a password.
 */
export function removeLocalPassword(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOCAL_LOCK_HASH_KEY);
  localStorage.removeItem(LOCAL_LOCK_SALT_KEY);
  sessionStorage.setItem(LOCAL_SESSION_KEY, 'unlocked');
}
