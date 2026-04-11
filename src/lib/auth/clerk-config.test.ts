import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clerkJwtIssuerDomainErrorMessage,
  getClerkJwtIssuerDomain,
  isClerkClientConfigured,
  isClerkConfigured,
  isClerkSatelliteConfigured,
} from "./clerk-config";

describe("clerk config", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports when Clerk server keys are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_abcdefghijklmnopqrstuvwxyz012345");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abcdefghijklmnopqrstuvwxyz012345");

    expect(isClerkConfigured()).toBe(true);
  });

  it("rejects placeholder Clerk keys", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

    expect(isClerkConfigured()).toBe(false);
  });

  it("rejects satellite mode without a domain or proxy", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_abcdefghijklmnopqrstuvwxyz012345");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_abcdefghijklmnopqrstuvwxyz012345");
    vi.stubEnv("NEXT_PUBLIC_CLERK_IS_SATELLITE", "true");

    expect(isClerkSatelliteConfigured()).toBe(false);
    expect(isClerkClientConfigured()).toBe(false);
    expect(isClerkConfigured()).toBe(false);
  });

  it("returns a normalized Clerk JWT issuer domain", () => {
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://clerk.budgetbitch.test/");

    expect(getClerkJwtIssuerDomain()).toBe("https://clerk.budgetbitch.test");
  });

  it("throws when the Clerk JWT issuer domain is missing", () => {
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "");

    expect(() => getClerkJwtIssuerDomain()).toThrowError(
      clerkJwtIssuerDomainErrorMessage,
    );
  });
});
