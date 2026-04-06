import { describe, expect, it } from "vitest";
import {
  createConnectionVaultEntry,
  revokeConnectionVaultEntry,
} from "./connection-vault";

describe("connection vault", () => {
  it("encrypts provider secrets and keeps only a fingerprint for display", () => {
    const entry = createConnectionVaultEntry({
      provider: "claude",
      secret: "sk_test_super_secret_value",
      encryptionKey: "budgetbitch-provider-secret-key-32",
    });

    expect(entry.provider).toBe("claude");
    expect(entry.encryptedSecret).not.toContain("sk_test_super_secret_value");
    expect(entry.secretFingerprint).toMatch(/^[a-f0-9]{12}$/);
    expect(entry.status).toBe("connected");
  });

  it("marks connections revoked without re-exposing the secret", () => {
    const revoked = revokeConnectionVaultEntry({
      provider: "openai",
      encryptedSecret: "sealed-value",
      secretFingerprint: "abc123def456",
      status: "connected",
    });

    expect(revoked.status).toBe("revoked");
    expect(revoked.revokedAt).toBeInstanceOf(Date);
    expect(revoked.encryptedSecret).toBe("sealed-value");
  });
});
