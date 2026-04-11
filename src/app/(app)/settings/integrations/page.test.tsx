import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import IntegrationsPage, { dynamic } from "./page";

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

describe("IntegrationsPage", () => {
  it("forces runtime rendering so deployment readiness reflects the live env", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  beforeEach(() => {
    vi.unstubAllEnvs();

    for (const envName of trackedEnvNames) {
      vi.stubEnv(envName, "");
    }
  });

  it("renders provider cards with explicit action labels for setup flows", () => {
    render(<IntegrationsPage />);

    expect(screen.getByText("Claude")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("GitHub Copilot")).toBeInTheDocument();
    expect(screen.getByText("OpenClaw")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Turn the env file into real capability" })).toBeInTheDocument();
    expect(screen.getByText("0 of 7 rails ready")).toBeInTheDocument();

    const emailCard = screen.getByText("Email delivery rail").closest("article");
    const claudeCard = screen.getByRole("heading", { level: 3, name: "Claude" }).closest("article");
    const openclawCard = screen
      .getByRole("heading", { level: 3, name: "OpenClaw" })
      .closest("article");

    expect(emailCard).not.toBeNull();
    expect(claudeCard).not.toBeNull();
    expect(openclawCard).not.toBeNull();
    expect(within(emailCard as HTMLElement).getByText("Missing env")).toBeInTheDocument();
    expect(
      within(emailCard as HTMLElement).getByText("RESEND_API_KEY, NEXT_PUBLIC_APP_URL"),
    ).toBeInTheDocument();

    expect(
      within(claudeCard as HTMLElement).getByRole("link", { name: "Open setup wizard" }),
    ).toHaveAttribute("href", "/settings/integrations/claude");
    expect(
      within(claudeCard as HTMLElement).getByRole("link", { name: "Open official login" }),
    ).toHaveAttribute("href", "https://platform.claude.com/login");
    expect(
      within(claudeCard as HTMLElement).getByRole("link", { name: "Open official docs" }),
    ).toHaveAttribute("href", "https://docs.anthropic.com");

    expect(
      within(openclawCard as HTMLElement).getByRole("link", { name: "Open setup wizard" }),
    ).toHaveAttribute("href", "/settings/integrations/openclaw");
    expect(
      within(openclawCard as HTMLElement).getByRole("link", { name: "Open official login" }),
    ).toHaveAttribute("href", "https://openclaw.ai/");
    expect(
      within(openclawCard as HTMLElement).getByRole("link", { name: "Open official docs" }),
    ).toHaveAttribute("href", "https://openclaw.ai/");
  });

  it("shows which capability rails are already configured for this deployment", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_budgetbitch");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_budgetbitch");
    vi.stubEnv("DATABASE_URL", "postgresql://budgetbitch");
    vi.stubEnv("PROVIDER_SECRET_ENCRYPTION_KEY", "budgetbitch-provider-secret-key-32");
    vi.stubEnv("SENTRY_DSN", "https://budgetbitch@example.ingest.sentry.io/project");

    render(<IntegrationsPage />);

    expect(screen.getByText("3 of 7 rails ready")).toBeInTheDocument();

    const authCard = screen.getByText("Auth and live workspace mode").closest("article");

    expect(authCard).not.toBeNull();
    expect(within(authCard as HTMLElement).getByText("Ready now")).toBeInTheDocument();
    expect(
      within(authCard as HTMLElement).getByText(
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, DATABASE_URL",
      ),
    ).toBeInTheDocument();
  });
});
