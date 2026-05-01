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
        "BudgetBITCH uses Convex Auth email and password accounts. Password reset and email verification are not enabled in this first pass.",
      googleAccountEyebrow: "Account credentials",
      googleAccountTitle: "Use your BudgetBITCH account.",
      googleAccountDescription:
        "Your account is created in Convex Auth with the email and password you choose on sign-up.",
      openGoogleSecurity: "Use a strong unique password with at least 8 characters.",
      openGooglePermissions: "Password reset and email verification are planned follow-ups.",
      sessionAccessEyebrow: "Session access",
      sessionAccessTitle: "Switch accounts safely.",
      sessionAccessDescription:
        "Sign out here if you need to return to the sign-in screen and use a different account.",
      privacyEyebrow: "Privacy",
      privacyItems: {
        signInOnly: "Convex Auth verifies sign-in and returns your account identity.",
        minimalData:
          "BudgetBITCH keeps only the local account, workspace, preference, and integration data it needs to run.",
        gmailPrivacy: "No Google OAuth client or user-managed environment file is required for login.",
      },
    },
  }),
}));

import SecuritySettingsPage from "./page";

describe("SecuritySettingsPage", () => {
  it("renders the product-owned Convex Auth security guidance", async () => {

    render(await SecuritySettingsPage());

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /open your account security controls\./i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/convex auth email and password accounts/i)).toBeInTheDocument();
    expect(screen.getByText(/use a strong unique password/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /google/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("auth-account-recovery-button")).toHaveAttribute(
      "data-redirect-to",
      "/",
    );
    expect(screen.getByText(/no google oauth client/i)).toBeInTheDocument();
  });
});