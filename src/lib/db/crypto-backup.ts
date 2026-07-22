// lib/db/crypto-backup.ts

/**
 * Derives an AES-GCM key from a password string and salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
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
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using AES-256-GCM with PBKDF2 key derivation.
 * Returns Base64 strings for ciphertext, salt, and IV.
 */
export async function encryptBackup(
  plaintext: string,
  password: string
): Promise<{ ciphertext: string; salt: string; iv: string }> {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Web Crypto API is not available');
  }

  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer))),
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
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
  ivBase64: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Web Crypto API is not available');
  }

  const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const encryptedData = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));

  const key = await deriveKey(password, salt);
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
