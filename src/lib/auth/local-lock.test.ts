import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasLocalPassword,
  isLocalUnlocked,
  setLocalPassword,
  unlockLocalVault,
  lockLocalVault,
  removeLocalPassword,
  getOrCreateLocalOwnerId,
} from './local-lock';

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
});
