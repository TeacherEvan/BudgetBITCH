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

    const decrypted = await decryptBackup(
      encrypted.ciphertext,
      password,
      encrypted.salt,
      encrypted.iv
    );

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
        encrypted.iv
      )
    ).rejects.toThrow();
  });
});
