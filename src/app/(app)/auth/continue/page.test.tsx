import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const currentUserMock = vi.hoisted(() => vi.fn());
const clerkConfiguredMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  currentUser: currentUserMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth/clerk-config", () => ({
  clerkConfigurationErrorMessage: "Clerk auth is not configured.",
  isClerkConfigured: clerkConfiguredMock,
}));

import AuthContinuePage from "./page";

describe("AuthContinuePage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous visitors to sign-in", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    await expect(AuthContinuePage()).rejects.toThrow("REDIRECT:/sign-in");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in");
  });

  it("renders recovery guidance when the Clerk account has no email", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: null,
      primaryEmailAddress: null,
      emailAddresses: [],
    });

    const view = await AuthContinuePage();
    render(view);

    expect(screen.getByRole("heading", { name: /add an email to finish setup/i })).toBeInTheDocument();
    expect(
      screen.getByText(/use an email-based clerk sign-in method, or add an email to this account/i),
    ).toBeInTheDocument();
  });

  it("renders the continue action for email-backed users", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: { emailAddress: "alex@example.com" },
      emailAddresses: [{ emailAddress: "alex@example.com" }],
    });

    const view = await AuthContinuePage();
    render(view);

    expect(screen.getByRole("heading", { name: /finish your local setup/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to dashboard/i })).toBeInTheDocument();
  });
});