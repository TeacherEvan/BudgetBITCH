/**
 * Verify a LINE Messaging API webhook signature.
 *
 * LINE sends an `x-line-signature` header containing the Base64-encoded
 * HMAC-SHA256 of the raw request body, computed with the channel secret.
 *
 * This helper is invoked from `lineWebhook`, an `httpAction` that runs in
 * Convex's DEFAULT (V8) runtime — not the Node.js runtime — so it uses the
 * Web Crypto API (`crypto.subtle`) rather than Node's `crypto` module.
 * (An httpAction can never be a `"use node"` action, so Node built-ins are
 * unavailable here.)
 *
 * We recompute the HMAC over `body` and compare it to `signature` using a
 * constant-time comparison so the result does not leak timing information
 * about how much of the signature was correct.
 *
 * @param body      Raw request body exactly as received (string).
 * @param signature Base64 signature from the `x-line-signature` header.
 * @param secret    LINE channel secret.
 * @returns         `true` when the signature is valid, `false` otherwise.
 *                  Never throws on a malformed/mismatched signature.
 */
export async function verifyLineSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();

  // Import the channel secret as an HMAC-SHA256 signing key.
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  // Compute the expected signature over the raw body.
  const expectedBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body),
  );
  const expectedBytes = new Uint8Array(expectedBuffer);

  // Decode the provided Base64 signature to bytes. `atob` throws on invalid
  // Base64 (e.g. junk signature) — guard that and simply reject.
  let providedBytes: Uint8Array;
  try {
    const binary = atob(signature);
    providedBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      providedBytes[i] = binary.charCodeAt(i);
    }
  } catch {
    return false;
  }

  // A length mismatch (e.g. junk signature) can never be a valid signature.
  if (expectedBytes.length !== providedBytes.length) {
    return false;
  }

  // Constant-time comparison: XOR every byte and accumulate differences so
  // the running time does not depend on where the first mismatch occurs.
  let diff = 0;
  for (let i = 0; i < expectedBytes.length; i++) {
    diff |= expectedBytes[i] ^ providedBytes[i];
  }
  return diff === 0;
}
