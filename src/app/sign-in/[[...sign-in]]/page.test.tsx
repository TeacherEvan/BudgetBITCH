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
  SignIn: ({ forceRedirectUrl }: { forceRedirectUrl: string }) => (
    <div data-testid="clerk-sign-in" data-force-redirect-url={forceRedirectUrl} />
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

import SignInPage from "./page";

describe("SignInPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated users to the continue step", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });

    await expect(SignInPage()).rejects.toThrow("REDIRECT:/auth/continue");
    expect(redirectMock).toHaveBeenCalledWith("/auth/continue");
  });

  it("renders the Clerk sign-in entry with the continue redirect", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const view = await SignInPage();
    render(view);

    expect(screen.getByRole("heading", { name: /open your budget board/i })).toBeInTheDocument();
    expect(screen.getByText(/email and password via clerk/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/use a passkey on supported devices/i)).toBeInTheDocument();
    expect(screen.getByText(/never stores raw biometric data/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute("href", "/sign-up");
    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
      "data-force-redirect-url",
      "/auth/continue",
    );
  });
});