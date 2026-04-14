import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clerkJwtIssuerDomainErrorMessage,
  getClerkJwtIssuerDomain,
  isClerkClientConfigured,
  isClerkConfigured,
} from "./clerk-config";

function createPublishableKey(host: string) {
  return `pk_test_${Buffer.from(`${host}$`, "utf8").toString("base64url")}`;
}

describe("clerk config", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports when Clerk server keys are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", createPublishableKey("clerk.budgetbitch.test"));
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");

    expect(isClerkConfigured()).toBe(true);
  });

  it("reports when Clerk client keys are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", createPublishableKey("clerk.budgetbitch.test"));

    expect(isClerkClientConfigured()).toBe(true);
  });

  it("treats placeholder Clerk keys as unconfigured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_replace_me");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_replace_me");

    expect(isClerkClientConfigured()).toBe(false);
    expect(isClerkConfigured()).toBe(false);
  });

  it("treats malformed Clerk publishable keys as unconfigured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_not-a-valid-host-payload");

    expect(isClerkClientConfigured()).toBe(false);
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
