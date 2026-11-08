// lib/db/crypto-backup.ts

/** PBKDF2 iterations for NEW backups (OWASP-recommended 600k). */
export const PBKDF2_ITERATIONS = 600_000;
/** Iterations used by pre-fix backups — decrypt must stay compatible. */
export const LEGACY_ITERATIONS = 100_000;
/** Minimum salt length accepted on decrypt. */
export const MIN_SALT_BYTES = 16;

/**
 * Derives an AES-GCM key from a password string and salt using PBKDF2.
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Converts a Uint8Array to a Base64 string in chunks to prevent
 * RangeError: Maximum call stack size exceeded when spreading large arrays.
 */
function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000; // 32KB
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

/**
 * Encrypts a plaintext string using AES-256-GCM with PBKDF2 key derivation.
 * Returns Base64 strings for ciphertext, salt, and IV.
 */
export async function encryptBackup(
  plaintext: string,
  password: string
): Promise<{ ciphertext: string; salt: string; iv: string; iterations: number }> {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Web Crypto API is not available');
  }
  if (!password || password.length === 0) {
    throw new Error('Password required for encryption');
  }

  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(32));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: uint8ToBase64(new Uint8Array(encryptedBuffer)),
    salt: uint8ToBase64(salt),
    iv: uint8ToBase64(iv),
    iterations: PBKDF2_ITERATIONS,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted backup package.
 * Decodes base64 inputs, derives the key, and decrypts the buffer to UTF-8 plaintext.
 */
export async function decryptBackup(
  ciphertext: string,
  password: string,
  saltBase64: string,
  ivBase64: string,
  iterations: number = LEGACY_ITERATIONS
): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Web Crypto API is not available');
  }
  if (!password || password.length === 0) {
    throw new Error('Password required for decryption');
  }

  const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
  if (salt.length < MIN_SALT_BYTES) {
    throw new Error(`Invalid salt length: ${salt.length} < ${MIN_SALT_BYTES} bytes`);
  }
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const encryptedData = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  // Backward compatible: old backups have no iterations field → 100k default.
  const key = await deriveKey(password, salt, iterations);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
