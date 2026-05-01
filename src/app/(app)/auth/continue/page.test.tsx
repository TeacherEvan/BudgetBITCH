import { render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentityMock = vi.hoisted(() => vi.fn());
const syncConvexLocalProfileMock = vi.hoisted(() => vi.fn());
const bootstrapUserMock = vi.hoisted(() => vi.fn());
const authBootstrapErrorCodes = vi.hoisted(() => ({
  authenticationRequired: "authentication-required",
  missingConvexSyncSecret: "missing-convex-sync-secret",
  convexIdentityFetchFailed: "convex-identity-fetch-failed",
  convexProfileSyncFailed: "convex-profile-sync-failed",
}));
const bootstrapUserLinkConflictErrorMessage = vi.hoisted(
  () => "A different auth account is already linked to this local profile.",
);
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

function makeAuthBootstrapError(input: {
  code: string;
  message: string;
  status: number;
}) {
  const error = new Error(input.message) as Error & {
    code: string;
    status: number;
  };
  error.name = "AuthBootstrapError";
  error.code = input.code;
  error.status = input.status;
  return error;
}

vi.mock("@/lib/auth/convex-session", () => ({
  authBootstrapErrorCodes,
  getConvexAuthenticatedIdentity: getConvexAuthenticatedIdentityMock,
  isAuthBootstrapError: (error: unknown) =>
    error instanceof Error &&
    "code" in error &&
    "status" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    typeof (error as { status: unknown }).status === "number",
  isAuthBootstrapErrorCode: (code: unknown) =>
    typeof code === "string" && Object.values(authBootstrapErrorCodes).includes(code),
  syncConvexLocalProfile: syncConvexLocalProfileMock,
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
      useGoogleToStart: "Create your account",
      useGoogleToContinue: "Use your account",
      googleOnly: "Convex Auth creates and protects BudgetBITCH accounts.",
      secureSignIn: "Use your email and password to open the same account on any device.",
      gmailPrivacy: "No Google OAuth client or user-managed env file is required for login.",
      minimalData:
        "BudgetBITCH keeps only the minimal account, workspace, preference, and integration data it needs to run.",
      whyThisStepExists: "Why this step exists",
      localProfileFirst: "Local profile first",
      localProfileDescription:
        "BudgetBITCH verifies the Convex Auth account, then creates your local profile, personal workspace, and default workspace preference once so the app can load the right data shape on the server.",
    },
    authContinue: {
      eyebrow: "Continue",
      missingEmailTitle: "Add an email to finish setup",
      missingEmailDescription:
        "BudgetBITCH requires an email-backed Convex account before local setup can finish.",
      missingEmailHelp:
        "Create or sign in with an email and password account, then return here to finish setup.",
      title: "Finish your local setup",
      description:
        "BudgetBITCH needs one local profile and one personal workspace before the dashboard can load server-side data for this account.",
      whatHappensNext: "What happens next",
      oneSafeBootstrap: "One safe bootstrap",
      oneSafeBootstrapDescription:
        "The continue action creates any missing records once, reuses them on later sign-ins, and then opens your dashboard with the resulting workspace selected.",
      relinkConflict:
        "This email is already linked to a different account. Sign out here, switch to the original sign-in method, or contact support before continuing.",
      bootstrapIssueTitle: "Setup needs attention",
      bootstrapIssueDescription:
        "BudgetBITCH could not finish the secure Convex setup step for this session.",
      bootstrapIssueHelp:
        "Try again after the app owner checks Convex Auth and CONVEX_SYNC_SECRET settings.",
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
    getConvexAuthenticatedIdentityMock.mockResolvedValue(null);

    await expect(AuthContinuePage()).rejects.toThrow(
      "REDIRECT:/sign-in?redirectTo=%2Fauth%2Fcontinue",
    );
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2Fauth%2Fcontinue");
  });

  it("preserves a safe root target when auth continue has to send users back to sign-in", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue(null);

    await expect(
      AuthContinuePage({ searchParams: Promise.resolve({ redirectTo: "/" }) }),
    ).rejects.toThrow("REDIRECT:/sign-in?redirectTo=%2F");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2F");
  });

  it("renders recovery guidance when the authenticated session has no verified email", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: null,
      name: "Alex Example",
    });

    const view = await AuthContinuePage();
    render(view);

    expect(screen.getByRole("heading", { name: /add an email to finish setup/i })).toBeInTheDocument();
    expect(
      screen.getByText(/create or sign in with an email and password account/i),
    ).toBeInTheDocument();
  });

  it("renders setup recovery guidance when Convex identity verification fails", async () => {
    getConvexAuthenticatedIdentityMock.mockRejectedValue(
      makeAuthBootstrapError({
        code: authBootstrapErrorCodes.convexIdentityFetchFailed,
        message:
          "BudgetBITCH could not verify your Convex Auth session. Try again in a moment.",
        status: 503,
      }),
    );

    const view = await AuthContinuePage();
    render(view);

    expect(screen.getByRole("heading", { name: /setup needs attention/i })).toBeInTheDocument();
    expect(
      screen.getByText(/checks convex auth and convex_sync_secret settings/i),
    ).toBeInTheDocument();
  });

  it("renders the continue action for email-backed users", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });

    const view = await AuthContinuePage();
    render(view);

    expect(screen.getByRole("heading", { name: /finish your local setup/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to dashboard/i })).toBeInTheDocument();
  });

  it("renders recovery guidance when bootstrap hits an account link conflict", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
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

  it("renders guided setup copy when bootstrap returns with a known config error", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });

    const view = await AuthContinuePage({
      searchParams: Promise.resolve({ error: "missing-convex-sync-secret" }),
    });
    render(view);

    expect(
      screen.getByText(/checks convex auth and convex_sync_secret settings/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to dashboard/i })).toBeInTheDocument();
  });

  it("boots the local workspace and redirects to the dashboard when the continue action runs", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });
    syncConvexLocalProfileMock.mockResolvedValue({ syncedAt: Date.now() });

    const view = await AuthContinuePage();
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow(
      "REDIRECT:/dashboard?workspaceId=workspace-1",
    );
    expect(bootstrapUserMock).toHaveBeenCalledWith({
      clerkUserId: "convex|user-1",
      email: "alex@example.com",
      displayName: "Alex Example",
    });
    expect(syncConvexLocalProfileMock).toHaveBeenCalledWith({
      profileId: "profile-1",
      displayName: "Alex Example",
    });
    expect(redirectMock).toHaveBeenCalledWith("/dashboard?workspaceId=workspace-1");
  });

  it("preserves a safe dashboard target until bootstrap finishes", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
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
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
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
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });
    bootstrapUserMock.mockRejectedValue(new Error(bootstrapUserLinkConflictErrorMessage));

    const view = await AuthContinuePage();
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow(
      "REDIRECT:/auth/continue?error=relink-conflict",
    );
    expect(redirectMock).toHaveBeenCalledWith("/auth/continue?error=relink-conflict");
  });

  it("redirects back to auth continue recovery when profile sync has a known config failure", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });
    syncConvexLocalProfileMock.mockRejectedValue(
      makeAuthBootstrapError({
        code: authBootstrapErrorCodes.missingConvexSyncSecret,
        message: "CONVEX_SYNC_SECRET is not configured for Convex profile sync.",
        status: 503,
      }),
    );

    const view = await AuthContinuePage();
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow(
      "REDIRECT:/auth/continue?error=missing-convex-sync-secret",
    );
    expect(redirectMock).toHaveBeenCalledWith(
      "/auth/continue?error=missing-convex-sync-secret",
    );
  });

  it("redirects to sign-in when profile sync loses authentication", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
    });
    bootstrapUserMock.mockResolvedValue({
      userId: "profile-1",
      workspaceId: "workspace-1",
    });
    syncConvexLocalProfileMock.mockRejectedValue(
      makeAuthBootstrapError({
        code: authBootstrapErrorCodes.authenticationRequired,
        message: "Authentication is required.",
        status: 401,
      }),
    );

    const view = await AuthContinuePage({
      searchParams: Promise.resolve({ redirectTo: "/" }),
    });
    const form = getContinueForm(view as ReactElement<{ children: ReactElement | ReactElement[] | null }>);

    await expect(form.props.action()).rejects.toThrow("REDIRECT:/sign-in?redirectTo=%2F");
    expect(redirectMock).toHaveBeenCalledWith("/sign-in?redirectTo=%2F");
  });

  it("preserves a safe root target when bootstrap hits a relink conflict", async () => {
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
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
    getConvexAuthenticatedIdentityMock.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
      email: "alex@example.com",
      name: "Alex Example",
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