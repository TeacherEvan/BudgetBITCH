import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const bootstrapUserMock = vi.hoisted(() => vi.fn());
const bootstrapUserLinkConflictErrorMessage = vi.hoisted(
  () => "A different Clerk account is already linked to this local profile.",
);
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("@/auth", () => ({
  auth: authMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({ refresh: () => undefined }),
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      label: "Language",
      "options.en": "English",
      "options.zh": "简体中文",
      "options.th": "ไทย",
    };

    return translations[key] ?? key;
  },
}));

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    authPanel: {
      secureAccess: "Secure access",
      useGoogleToStart: "Use Google to start",
      useGoogleToContinue: "Use Google to continue",
      googleOnly: "Google is the only sign-in method for this app.",
      secureSignIn: "Google is only used for secure sign-in and account verification.",
      gmailPrivacy: "BudgetBITCH never reads or stores Gmail inbox or message content.",
      minimalData:
        "BudgetBITCH keeps only the minimal account, workspace, preference, and integration data it needs to run.",
      whyThisStepExists: "Why this step exists",
      localProfileFirst: "Local profile first",
      localProfileDescription:
        "BudgetBITCH uses Google to verify who you are, then creates your local profile, personal workspace, and default workspace preference once so the app can load the right data shape on the server.",
    },
    authContinue: {
      eyebrow: "Continue",
      missingEmailTitle: "Add an email to finish setup",
      missingEmailDescription:
        "BudgetBITCH requires a verified Google email account before local setup can finish.",
      missingEmailHelp:
        "Use the Google sign-in flow with a verified email account, then return here to finish setup.",
      title: "Finish your local setup",
      description:
        "BudgetBITCH needs one local profile and one personal workspace before the dashboard can load server-side data for this account.",
      whatHappensNext: "What happens next",
      oneSafeBootstrap: "One safe bootstrap",
      oneSafeBootstrapDescription:
        "The continue action creates any missing records once, reuses them on later sign-ins, and then opens your dashboard with the resulting workspace selected.",
      relinkConflict:
        "This email is already linked to a different account. Sign out here, switch to the original sign-in method, or contact support before continuing.",
      continueToDashboard: "Continue to dashboard",
      rerunSafe:
        "This is safe to run again if your session already created the local records.",
    },
  }),
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
    authMock.mockResolvedValue(null);

    await expect(AuthContinuePage()).rejects.toThrow(
      "REDIRECT:/sign-in?redirectTo=%2Fauth%2Fcontinue",
    );
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2Fauth%2Fcontinue");
  });

  it("preserves a safe root target when auth continue has to send users back to sign-in", async () => {
    authMock.mockResolvedValue(null);

    await expect(
      AuthContinuePage({ searchParams: Promise.resolve({ redirectTo: "/" }) }),
    ).rejects.toThrow("REDIRECT:/sign-in?redirectTo=%2F");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2F");
  });

  it("renders recovery guidance when the authenticated session has no verified email", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: false,
      },
    });

    const view = await AuthContinuePage();
    render(view);

    expect(screen.getByRole("heading", { name: /add an email to finish setup/i })).toBeInTheDocument();
    expect(
      screen.getByText(/use the google sign-in flow with a verified email account/i),
    ).toBeInTheDocument();
  });

  it("renders the continue action for email-backed users", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
    });

    const view = await AuthContinuePage();
    render(view);

    expect(screen.getByRole("heading", { name: /finish your local setup/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to dashboard/i })).toBeInTheDocument();
  });

  it("renders recovery guidance when bootstrap hits an account link conflict", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
    });

    const view = await AuthContinuePage({
      searchParams: Promise.resolve({ error: "relink-conflict" }),
    });
    render(view);

    expect(
      screen.getByText(/already linked to a different account/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("auth-account-recovery-button")).toHaveAttribute(
      "data-redirect-to",
      "/auth/continue",
    );
  });

  it("boots the local workspace and redirects to the dashboard when the continue action runs", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
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
      clerkUserId: "google-sub-1",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
    expect(redirectMock).toHaveBeenCalledWith("/dashboard?workspaceId=workspace-1");
  });

  it("preserves a safe dashboard target until bootstrap finishes", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
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
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
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

  it("redirects back to auth continue recovery when bootstrap finds an account link conflict", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
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
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
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
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
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