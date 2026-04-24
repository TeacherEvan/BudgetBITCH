import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const currentUserMock = vi.hoisted(() => vi.fn());
const clerkConfiguredMock = vi.hoisted(() => vi.fn());
const bootstrapUserMock = vi.hoisted(() => vi.fn());
const bootstrapUserLinkConflictErrorMessage = vi.hoisted(
  () => "A different Clerk account is already linked to this local profile.",
);
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

vi.mock("@/modules/auth/bootstrap-user", () => ({
  bootstrapUserLinkConflictErrorMessage,
  bootstrapUser: bootstrapUserMock,
}));

vi.mock("@/components/auth/auth-account-recovery-button", () => ({
  AuthAccountRecoveryButton: ({ redirectTo }: { redirectTo: string }) => (
    <div data-testid="auth-account-recovery-button" data-redirect-to={redirectTo} />
  ),
}));

import AuthContinuePage from "./page";

function getContinueForm(view: ReactElement<{ children: ReactElement | ReactElement[] | null }>) {
  const children = view.props.children;

  if (Array.isArray(children)) {
    return children.at(-1) as ReactElement;
  }

  return children as ReactElement;
}

describe("AuthContinuePage", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous visitors to sign-in with an auth continue target", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    await expect(AuthContinuePage()).rejects.toThrow(
      "REDIRECT:/sign-in?redirectTo=%2Fauth%2Fcontinue",
    );
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2Fauth%2Fcontinue");
  });

  it("preserves a safe root target when auth continue has to send users back to sign-in", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: null });

    await expect(
      AuthContinuePage({ searchParams: Promise.resolve({ redirectTo: "/" }) }),
    ).rejects.toThrow("REDIRECT:/sign-in?redirectTo=%2F");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2F");
  });

  it("renders recovery guidance when the Clerk account has no verified email", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: null,
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "unverified" },
      },
      emailAddresses: [{ emailAddress: "alex@example.com", verification: { status: "unverified" } }],
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
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });

    const view = await AuthContinuePage();
    render(view);

    expect(screen.getByRole("heading", { name: /finish your local setup/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to dashboard/i })).toBeInTheDocument();
  });

  it("renders recovery guidance when bootstrap hits a Clerk link conflict", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });

    const view = await AuthContinuePage({
      searchParams: Promise.resolve({ error: "relink-conflict" }),
    });
    render(view);

    expect(
      screen.getByText(/already linked to a different clerk account/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("auth-account-recovery-button")).toHaveAttribute(
      "data-redirect-to",
      "/auth/continue",
    );
  });

  it("boots the local workspace and redirects to the dashboard when the continue action runs", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });

    const view = await AuthContinuePage();
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow(
      "REDIRECT:/dashboard?workspaceId=workspace-1",
    );
    expect(bootstrapUserMock).toHaveBeenCalledWith({
      clerkUserId: "clerk_user_1",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
    expect(redirectMock).toHaveBeenCalledWith("/dashboard?workspaceId=workspace-1");
  });

  it("preserves a safe dashboard target until bootstrap finishes", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });

    const view = await AuthContinuePage({
      searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
    });
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow(
      "REDIRECT:/dashboard?from=welcome&workspaceId=workspace-1",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/dashboard?from=welcome&workspaceId=workspace-1",
    );
  });

  it("returns to the root gate when bootstrap finishes with a safe root target", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });

    const view = await AuthContinuePage({
      searchParams: Promise.resolve({ redirectTo: "/" }),
    });
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow("REDIRECT:/");
    expect(redirectMock).toHaveBeenCalledWith("/");
  });

  it("redirects back to auth continue recovery when bootstrap finds a Clerk link conflict", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });
    bootstrapUserMock.mockRejectedValue(new Error(bootstrapUserLinkConflictErrorMessage));

    const view = await AuthContinuePage();
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow(
      "REDIRECT:/auth/continue?error=relink-conflict",
    );
    expect(redirectMock).toHaveBeenCalledWith("/auth/continue?error=relink-conflict");
  });

  it("preserves a safe root target when bootstrap hits a relink conflict", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });
    bootstrapUserMock.mockRejectedValue(new Error(bootstrapUserLinkConflictErrorMessage));

    const view = await AuthContinuePage({
      searchParams: Promise.resolve({ redirectTo: "/" }),
    });
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow(
      "REDIRECT:/auth/continue?error=relink-conflict&redirectTo=%2F",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/auth/continue?error=relink-conflict&redirectTo=%2F",
    );
  });

  it("offers an account-switch recovery action that preserves a safe root target", async () => {
    clerkConfiguredMock.mockReturnValue(true);
    authMock.mockResolvedValue({ userId: "clerk_user_1" });
    currentUserMock.mockResolvedValue({
      firstName: "Alex",
      lastName: "Example",
      username: "alex",
      primaryEmailAddress: {
        emailAddress: "alex@example.com",
        verification: { status: "verified" },
      },
      emailAddresses: [
        { emailAddress: "alex@example.com", verification: { status: "verified" } },
      ],
    });

    const view = await AuthContinuePage({
      searchParams: Promise.resolve({ error: "relink-conflict", redirectTo: "/" }),
    });
    render(view);

    expect(screen.getByTestId("auth-account-recovery-button")).toHaveAttribute(
      "data-redirect-to",
      "/",
    );
  });
});