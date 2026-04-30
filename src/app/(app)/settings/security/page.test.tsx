import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth/auth-account-recovery-button", () => ({
  AuthAccountRecoveryButton: ({ redirectTo }: { redirectTo: string }) => (
    <div data-testid="auth-account-recovery-button" data-redirect-to={redirectTo} />
  ),
}));

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    securitySettings: {
      eyebrow: "Security settings",
      title: "Open your account security controls.",
      description:
        "BudgetBITCH uses Google for secure sign-in only. This app does not use a separate BudgetBITCH password, does not manage passkeys here, and never reads or stores Gmail inbox or message content.",
      googleAccountEyebrow: "Google account",
      googleAccountTitle: "Open Google account security.",
      googleAccountDescription:
        "Use your Google Account security page to review sign-in activity, connected sessions, recovery options, and multi-factor protections for the identity you use with this app.",
      openGoogleSecurity: "Open Google account security",
      openGooglePermissions: "Open Google app permissions",
      sessionAccessEyebrow: "Session access",
      sessionAccessTitle: "Switch accounts safely.",
      sessionAccessDescription:
        "Sign out here if you need to return to the Google sign-in screen and use a different account.",
      privacyEyebrow: "Privacy",
      privacyItems: {
        signInOnly: "Google is used only to verify sign-in and return your account identity.",
        minimalData:
          "BudgetBITCH keeps only the local account, workspace, preference, and integration data it needs to run.",
        gmailPrivacy: "Gmail inbox and message content are never read or stored by this app.",
      },
    },
  }),
}));

import SecuritySettingsPage from "./page";

describe("SecuritySettingsPage", () => {
  it("renders the product-owned Google security guidance", async () => {

    render(await SecuritySettingsPage());

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /open your account security controls\./i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not use a separate budgetbitch password/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /open google account security/i }),
    ).toHaveAttribute(
      "href",
      "https://myaccount.google.com/security",
    );
    expect(
      screen.getByRole("link", { name: /open google app permissions/i }),
    ).toHaveAttribute(
      "href",
      "https://myaccount.google.com/permissions",
    );
    expect(screen.getByTestId("auth-account-recovery-button")).toHaveAttribute(
      "data-redirect-to",
      "/",
    );
    expect(screen.getByText(/gmail inbox and message content are never read or stored/i)).toBeInTheDocument();
  });
});