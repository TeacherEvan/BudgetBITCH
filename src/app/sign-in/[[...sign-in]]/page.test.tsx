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
  SignIn: ({ forceRedirectUrl, signUpUrl }: { forceRedirectUrl: string; signUpUrl: string }) => (
    <div
      data-testid="clerk-sign-in"
      data-force-redirect-url={forceRedirectUrl}
      data-sign-up-url={signUpUrl}
    />
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

  it("redirects authenticated users to the sanitized target", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });

    await expect(
      SignInPage({
        searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
      }),
    ).rejects.toThrow("REDIRECT:/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome");
    expect(redirectMock).toHaveBeenCalledWith(
      "/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
    );
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
    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
      "data-sign-up-url",
      "/sign-up",
    );
  });

  it("passes only a safe redirect target to Clerk", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const view = await SignInPage({
      searchParams: Promise.resolve({ redirectTo: "https://evil.example/steal" }),
    });
    render(view);

    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
      "data-force-redirect-url",
      "/auth/continue",
    );
  });

  it("routes safe dashboard targets through auth continue before Clerk completes", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const view = await SignInPage({
      searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
    });
    render(view);

    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
      "data-force-redirect-url",
      "/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
    );
  });

  it("routes a safe root target through auth continue before Clerk completes", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const view = await SignInPage({
      searchParams: Promise.resolve({ redirectTo: "/" }),
    });
    render(view);

    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
      "data-force-redirect-url",
      "/auth/continue?redirectTo=%2F",
    );
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute(
      "href",
      "/sign-up?redirectTo=%2F",
    );
    expect(screen.getByTestId("clerk-sign-in")).toHaveAttribute(
      "data-sign-up-url",
      "/sign-up?redirectTo=%2F",
    );
  });
});