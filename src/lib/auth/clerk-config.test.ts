import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clerkJwtIssuerDomainErrorMessage,
  getClerkJwtIssuerDomain,
  isClerkConfigured,
} from "./clerk-config";

describe("clerk config", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports when Clerk server keys are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

    expect(isClerkConfigured()).toBe(true);
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
