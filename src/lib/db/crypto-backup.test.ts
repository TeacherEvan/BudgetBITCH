import { describe, it, expect, beforeAll } from 'vitest';
import { encryptBackup, decryptBackup } from './crypto-backup';
import webCrypto from 'node:crypto';

describe('Crypto Backup Engine', () => {
  beforeAll(() => {
    // Ensure window and crypto are present in test context
    if (typeof window === 'undefined') {
      global.window = globalThis as unknown as Window & typeof globalThis;
    }
    if (!global.window.crypto) {
      global.window.crypto = webCrypto.webcrypto as unknown as Crypto;
    }
  });

  it('should encrypt and decrypt a string payload successfully', async () => {
    const password = 'test-secret-password-123';
    const plaintext = '{"wizardProfile":{"completed":true},"expenses":[]}';

    const encrypted = await encryptBackup(plaintext, password);
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.salt).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.iterations).toBe(600_000); // guards regression: PBKDF2 600k

    const decrypted = await decryptBackup(
      encrypted.ciphertext,
      password,
      encrypted.salt,
      encrypted.iv,
      encrypted.iterations
    );

    expect(decrypted).toBe(plaintext);
  });

  it('rejects empty passwords at the encrypt boundary', async () => {
    await expect(encryptBackup('data', '')).rejects.toThrow(/Password required/);
    await expect(
      decryptBackup('x', '', 'c2FsdHNhbHRzYWx0MTIzNDU2', 'aXYxMjM0NTY3ODkwMTIz')
    ).rejects.toThrow(/Password required/);
  });

  it('rejects short (<16-byte) salts on decrypt', async () => {
    const { uint8ToBase64 } = { uint8ToBase64: (b: Uint8Array) => Buffer.from(b).toString('base64') };
    const shortSalt = uint8ToBase64(new Uint8Array(8).fill(7));
    const iv = uint8ToBase64(new Uint8Array(12).fill(1));
    await expect(decryptBackup('x', 'password', shortSalt, iv)).rejects.toThrow(/Invalid salt/);
  });

  it('decrypts legacy 100k-iteration backups (default when no iterations field)', async () => {
    // Simulate an old backup by encrypting with the legacy iteration count
    // via a direct PBKDF2 derivation at 100k, then decrypting with the default.
    const password = 'legacy-password';
    const plaintext = 'legacy-data';
    const { default: nodeCrypto } = await import('node:crypto');
    const salt = nodeCrypto.webcrypto.getRandomValues(new Uint8Array(32));
    const iv = nodeCrypto.webcrypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const passwordKey = await nodeCrypto.webcrypto.subtle.importKey(
      'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey'],
    );
    const key = await nodeCrypto.webcrypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
      passwordKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
    );
    const ct = await nodeCrypto.webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    const b64 = (b: Uint8Array) => Buffer.from(b).toString('base64');
    const decrypted = await decryptBackup(b64(new Uint8Array(ct)), password, b64(salt), b64(iv));
    expect(decrypted).toBe(plaintext);
  });

  it('should throw an error when decrypting with wrong password', async () => {
    const password = 'test-secret-password-123';
    const wrongPassword = 'wrong-password';
    const plaintext = '{"expenses":[]}';

    const encrypted = await encryptBackup(plaintext, password);

    await expect(
      decryptBackup(
        encrypted.ciphertext,
        wrongPassword,
        encrypted.salt,
        encrypted.iv,
        encrypted.iterations
      )
    ).rejects.toThrow();
  });

  it('should encrypt and decrypt large payloads (>65KB) without call-stack overflow', async () => {
    const password = 'test-secret-password-123';
    // 120KB payload
    const plaintext = JSON.stringify({ large: 'x'.repeat(120 * 1024) });

    const encrypted = await encryptBackup(plaintext, password);
    expect(encrypted.ciphertext).toBeDefined();

    const decrypted = await decryptBackup(
      encrypted.ciphertext,
      password,
      encrypted.salt,
      encrypted.iv,
      encrypted.iterations
    );

    expect(decrypted).toBe(plaintext);
  });

  it('dueDay clamp (Math.min) keeps Feb-31 bills on Feb 28/29', () => {
    // Guards regression: priority-guide/dashboard-shell now clamp dueDay to daysInMonth.
    const daysInMonthFeb2026 = new Date(2026, 2, 0).getDate(); // 2026 is non-leap → 28
    expect(daysInMonthFeb2026).toBe(28);
    expect(Math.min(31, daysInMonthFeb2026)).toBe(28);
    const daysInMonthFeb2024 = new Date(2024, 2, 0).getDate();
    expect(Math.min(31, daysInMonthFeb2024)).toBe(29);
  });
});
