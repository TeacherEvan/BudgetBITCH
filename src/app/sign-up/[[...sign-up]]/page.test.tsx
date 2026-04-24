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
  SignUp: ({ forceRedirectUrl, signInUrl }: { forceRedirectUrl: string; signInUrl: string }) => (
    <div
      data-testid="clerk-sign-up"
      data-force-redirect-url={forceRedirectUrl}
      data-sign-in-url={signInUrl}
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

import SignUpPage from "./page";

describe("SignUpPage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated users to the sanitized target", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });

    await expect(
      SignUpPage({
        searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
      }),
    ).rejects.toThrow("REDIRECT:/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome");
    expect(redirectMock).toHaveBeenCalledWith(
      "/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
    );
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
    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-sign-in-url",
      "/sign-in",
    );
  });

  it("passes only a safe redirect target to Clerk", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const view = await SignUpPage({
      searchParams: Promise.resolve({ redirectTo: "https://evil.example/steal" }),
    });
    render(view);

    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-force-redirect-url",
      "/auth/continue",
    );
  });

  it("routes safe dashboard targets through auth continue before Clerk completes", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const view = await SignUpPage({
      searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
    });
    render(view);

    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-force-redirect-url",
      "/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
    );
  });

  it("routes a safe root target through auth continue before Clerk completes", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    const view = await SignUpPage({
      searchParams: Promise.resolve({ redirectTo: "/" }),
    });
    render(view);

    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-force-redirect-url",
      "/auth/continue?redirectTo=%2F",
    );
    expect(screen.getByRole("link", { name: /open sign-in/i })).toHaveAttribute(
      "href",
      "/sign-in?redirectTo=%2F",
    );
    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-sign-in-url",
      "/sign-in?redirectTo=%2F",
    );
  });
});