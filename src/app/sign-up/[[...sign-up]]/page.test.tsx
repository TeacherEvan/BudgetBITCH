import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const clerkConfiguredMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("@clerk/nextjs", () => ({
  SignUp: ({ forceRedirectUrl }: { forceRedirectUrl: string }) => (
    <div data-testid="clerk-sign-up" data-force-redirect-url={forceRedirectUrl} />
  ),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth/clerk-config", () => ({
  clerkConfigurationErrorMessage: "Clerk auth is not configured.",
  isClerkConfigured: clerkConfiguredMock,
}));

import SignUpPage from "./page";

describe("SignUpPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated users to the continue step", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });

    await expect(SignUpPage()).rejects.toThrow("REDIRECT:/auth/continue");
    expect(redirectMock).toHaveBeenCalledWith("/auth/continue");
  });

  it("renders the Clerk sign-up entry and the email-backed guidance", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const view = await SignUpPage();
    render(view);

    expect(screen.getByRole("heading", { name: /create your budget login/i })).toBeInTheDocument();
    expect(screen.getByText(/email and password via clerk/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/add a passkey after setup on supported devices/i)).toBeInTheDocument();
    expect(screen.getByText(/never stores raw biometric data/i)).toBeInTheDocument();
    expect(screen.getByText(/use an email-backed sign-up method here/i)).toBeInTheDocument();
    expect(screen.getByText(/add a supported passkey from security settings/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign-in/i })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-force-redirect-url",
      "/auth/continue",
    );
  });
});