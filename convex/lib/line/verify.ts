import crypto from "crypto";

/**
 * Verify a LINE Messaging API webhook signature.
 *
 * LINE sends an `x-line-signature` header containing the Base64-encoded
 * HMAC-SHA256 of the raw request body, computed with the channel secret.
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
export function verifyLineSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  // Compute expected signature: HMAC-SHA256 over body, Base64-encoded.
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("base64");

  // Decode both sides to bytes so we can use a constant-time compare.
  // If either side is not valid Base64, decoding yields a different length
  // and `timingSafeEqual` would throw — guard that here and simply reject.
  let expectedBytes: Buffer;
  let providedBytes: Buffer;
  try {
    expectedBytes = Buffer.from(expected, "base64");
    providedBytes = Buffer.from(signature, "base64");
  } catch {
    return false;
  }

  // timingSafeEqual requires equal-length buffers; otherwise the lengths
  // differ (e.g. junk signature) and we must return false, not throw.
  if (expectedBytes.length !== providedBytes.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBytes, providedBytes);
}
