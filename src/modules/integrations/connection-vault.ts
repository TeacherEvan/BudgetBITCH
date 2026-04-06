import crypto from "node:crypto";
import type { ProviderId } from "./provider-types";

export type ConnectionVaultEntry = {
  provider: ProviderId;
  encryptedSecret: string;
  secretFingerprint: string;
  status: "connected" | "revoked";
  revokedAt?: Date;
};

type CreateConnectionVaultEntryInput = {
  provider: ProviderId;
  secret: string;
  encryptionKey: string;
};

function deriveKey(encryptionKey: string) {
  return crypto.createHash("sha256").update(encryptionKey).digest();
}

function fingerprintSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest("hex").slice(0, 12);
}

function encryptSecret(secret: string, encryptionKey: string) {
  const iv = crypto.randomBytes(12);
  const key = deriveKey(encryptionKey);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function createConnectionVaultEntry(
  input: CreateConnectionVaultEntryInput,
): ConnectionVaultEntry {
  return {
    provider: input.provider,
    encryptedSecret: encryptSecret(input.secret, input.encryptionKey),
    secretFingerprint: fingerprintSecret(input.secret),
    status: "connected",
  };
}

export function revokeConnectionVaultEntry(
  entry: Omit<ConnectionVaultEntry, "revokedAt">,
): ConnectionVaultEntry {
  return {
    ...entry,
    status: "revoked",
    revokedAt: new Date(),
  };
}
