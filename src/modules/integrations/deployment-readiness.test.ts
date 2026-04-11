import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDeploymentReadiness } from "./deployment-readiness";

const trackedEnvNames = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "DATABASE_URL",
  "NEXT_PUBLIC_CONVEX_URL",
  "CLERK_JWT_ISSUER_DOMAIN",
  "CONVEX_SYNC_SECRET",
  "CRON_SECRET",
  "PROVIDER_SECRET_ENCRYPTION_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY",
  "WEBHOOK_SIGNING_SECRET",
  "SENTRY_DSN",
] as const;

describe("getDeploymentReadiness", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();

    for (const envName of trackedEnvNames) {
      vi.stubEnv(envName, "");
    }
  });

  it("reports every capability as needing setup when the env file is still empty", () => {
    const readiness = getDeploymentReadiness();

    expect(readiness.readyCount).toBe(0);
    expect(readiness.totalCount).toBe(7);
    expect(readiness.capabilities.every((capability) => capability.status === "needs_setup")).toBe(
      true,
    );
    expect(readiness.capabilities[0]).toMatchObject({
      missingEnvVars: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "DATABASE_URL"],
      readyCount: 0,
      status: "needs_setup",
      title: "Auth and live workspace mode",
      totalCount: 3,
    });
  });

  it("marks only fully configured capability rails as ready and preserves missing env names", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");
    vi.stubEnv("DATABASE_URL", "postgresql://budgetbitch");
    vi.stubEnv("PROVIDER_SECRET_ENCRYPTION_KEY", "budgetbitch-provider-secret-key-32");
    vi.stubEnv("SENTRY_DSN", "https://budgetbitch@example.ingest.sentry.io/project");
    vi.stubEnv("RESEND_API_KEY", "re_budgetbitch");

    const readiness = getDeploymentReadiness();
    const authCapability = readiness.capabilities.find(
      (capability) => capability.id === "auth_workspace_mode",
    );
    const emailCapability = readiness.capabilities.find(
      (capability) => capability.id === "email_delivery",
    );

    expect(readiness.readyCount).toBe(3);
    expect(authCapability).toMatchObject({
      configuredEnvVars: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "DATABASE_URL"],
      readyCount: 3,
      status: "ready",
      totalCount: 3,
    });
    expect(emailCapability).toMatchObject({
      configuredEnvVars: ["RESEND_API_KEY"],
      missingEnvVars: ["NEXT_PUBLIC_APP_URL"],
      readyCount: 1,
      status: "needs_setup",
      totalCount: 2,
    });
  });
});
