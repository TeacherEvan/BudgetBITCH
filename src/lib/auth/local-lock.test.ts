import { webcrypto } from 'node:crypto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hasLocalPassword,
  isLocalUnlocked,
  setLocalPassword,
  unlockLocalVault,
  lockLocalVault,
  removeLocalPassword,
  getOrCreateLocalOwnerId,
  isLocalModePreferred,
  setLocalModePreferred,
} from './local-lock';

const LOCK_BLOB_KEY = 'bb:localLock';

describe('local-lock', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('reports unlocked by default when no password is set', () => {
    expect(hasLocalPassword()).toBe(false);
    expect(isLocalUnlocked()).toBe(true);
  });

  it('sets a password, locks, and unlocks correctly', async () => {
    await setLocalPassword('supersecret123');

    expect(hasLocalPassword()).toBe(true);
    expect(isLocalUnlocked()).toBe(true);

    lockLocalVault();
    expect(isLocalUnlocked()).toBe(false);

    // Wrong password fails
    const failed = await unlockLocalVault('wrongpass');
    expect(failed).toBe(false);
    expect(isLocalUnlocked()).toBe(false);

    // Correct password unlocks
    const success = await unlockLocalVault('supersecret123');
    expect(success).toBe(true);
    expect(isLocalUnlocked()).toBe(true);
  });

  it('removes password and reverts to unlocked by default', async () => {
    await setLocalPassword('pin1234');
    lockLocalVault();
    expect(isLocalUnlocked()).toBe(false);

    removeLocalPassword();
    expect(hasLocalPassword()).toBe(false);
    expect(isLocalUnlocked()).toBe(true);
  });

  it('generates and persists a stable local owner ID', () => {
    const id1 = getOrCreateLocalOwnerId();
    expect(id1).toMatch(/^local:/);
    const id2 = getOrCreateLocalOwnerId();
    expect(id1).toBe(id2);
  });

  // N8: salt + hash + params live in ONE versioned blob at 600k iterations.
  it('rejects an empty password and leaves no lock behind', async () => {
    await expect(setLocalPassword('')).rejects.toThrow(/Password required/);
    expect(hasLocalPassword()).toBe(false);
    expect(localStorage.getItem(LOCK_BLOB_KEY)).toBeNull();
  });

  it('stores a single versioned lock blob at 600k iterations (no split salt/hash keys)', async () => {
    await setLocalPassword('strong-pass-123');
    const raw = localStorage.getItem(LOCK_BLOB_KEY);
    expect(raw).toBeTruthy();
    const blob = JSON.parse(raw as string);
    expect(blob).toMatchObject({ version: 1, iterations: 600_000 });
    expect(blob.salt).toBeTruthy();
    expect(blob.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(localStorage.getItem('bb:localLockSalt')).toBeNull();
    expect(localStorage.getItem('bb:localLockHash')).toBeNull();

    lockLocalVault();
    expect(await unlockLocalVault('strong-pass-123')).toBe(true);
  });

  it('removes the whole blob and stays unlocked when the lock write fails', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    try {
      await expect(setLocalPassword('strong-pass-123')).rejects.toThrow(/QuotaExceededError/);
      expect(hasLocalPassword()).toBe(false);
      expect(isLocalUnlocked()).toBe(true);
      expect(localStorage.getItem(LOCK_BLOB_KEY)).toBeNull();
    } finally {
      setItem.mockRestore();
    }
  });

  it('throttles repeated failed unlock attempts with a persisted exponential cooldown', async () => {
    vi.useFakeTimers();
    try {
      await setLocalPassword('strong-pass-123');
      lockLocalVault();
      for (let i = 0; i < 3; i++) {
        expect(await unlockLocalVault('wrong')).toBe(false);
      }
      // Even the CORRECT password is refused while the cooldown is active.
      expect(await unlockLocalVault('strong-pass-123')).toBe(false);
      vi.setSystemTime(Date.now() + 5_000);
      expect(await unlockLocalVault('strong-pass-123')).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('verifies a legacy 100k lock and rehashes it at 600k on unlock', async () => {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
    const enc = new TextEncoder();
    const passwordKey = await webcrypto.subtle.importKey(
      'raw', enc.encode('legacy-pass'), { name: 'PBKDF2' }, false, ['deriveBits'],
    );
    const bits = await webcrypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: salt as never, iterations: 100_000, hash: 'SHA-256' },
      passwordKey,
      256,
    );
    const hash = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('bb:localLockSalt', saltHex);
    localStorage.setItem('bb:localLockHash', hash);

    expect(hasLocalPassword()).toBe(true);
    expect(await unlockLocalVault('legacy-pass')).toBe(true);
    expect(JSON.parse(localStorage.getItem(LOCK_BLOB_KEY) as string)).toMatchObject({
      version: 1,
      iterations: 600_000,
    });
    expect(localStorage.getItem('bb:localLockSalt')).toBeNull();
    expect(localStorage.getItem('bb:localLockHash')).toBeNull();
  });

  // C5: strict WebViews can throw SecurityError on ANY storage access.
  it('does not throw when storage access is denied', () => {
    const deny = () => {
      throw new Error('SecurityError: storage disabled');
    };
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(deny);
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(deny);
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(deny);
    try {
      expect(() => isLocalModePreferred()).not.toThrow();
      expect(() => setLocalModePreferred(true)).not.toThrow();
      expect(() => hasLocalPassword()).not.toThrow();
      expect(() => isLocalUnlocked()).not.toThrow();
      expect(() => getOrCreateLocalOwnerId()).not.toThrow();
      expect(() => lockLocalVault()).not.toThrow();
      expect(() => removeLocalPassword()).not.toThrow();
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
      removeItem.mockRestore();
    }
  });
});
