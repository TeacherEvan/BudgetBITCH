import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const clerkConfiguredMock = vi.hoisted(() => vi.fn());

vi.mock("@clerk/nextjs", () => ({
  UserProfile: ({ path, routing }: { path: string; routing: string }) => (
    <div data-testid="clerk-user-profile" data-path={path} data-routing={routing} />
  ),
}));

vi.mock("@/lib/auth/clerk-config", () => ({
  clerkConfigurationErrorMessage: "Clerk auth is not configured.",
  isClerkConfigured: clerkConfiguredMock,
}));

import SecuritySettingsPage from "./page";

describe("SecuritySettingsPage", () => {
  it("renders a setup notice when Clerk is not configured", () => {
    clerkConfiguredMock.mockReturnValue(false);

    render(<SecuritySettingsPage />);

    expect(screen.getByRole("heading", { name: /security settings are not ready yet\./i })).toBeInTheDocument();
    expect(screen.getByText("Clerk auth is not configured.")).toBeInTheDocument();
    expect(screen.queryByTestId("clerk-user-profile")).not.toBeInTheDocument();
  });

  it("renders the Clerk account management profile on the security path", () => {
    clerkConfiguredMock.mockReturnValue(true);

    render(<SecuritySettingsPage />);

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /open your account security controls\./i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/device biometrics stay with your passkey provider/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("clerk-user-profile")).toHaveAttribute(
      "data-path",
      "/settings/security",
    );
    expect(screen.getByTestId("clerk-user-profile")).toHaveAttribute(
      "data-routing",
      "path",
    );
  });
});