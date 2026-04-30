import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const signInMock = vi.hoisted(() => vi.fn());
const isGoogleOAuthConfiguredMock = vi.hoisted(() => vi.fn(() => true));
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("@/auth", () => ({
  auth: authMock,
  signIn: signInMock,
}));

vi.mock("@/lib/auth/oauth-config", () => ({
  isGoogleOAuthConfigured: isGoogleOAuthConfiguredMock,
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
    signIn: {
      eyebrow: "Sign in",
      title: "Open your budget board",
      description:
        "Use Google to sign in, then let BudgetBITCH finish local setup for your workspace before the dashboard opens.",
      needAccount: "Need an account?",
      openSignUp: "Open sign-up",
      continueWithGoogle: "Continue with Google",
      privacy:
        "Google is only used for secure sign-in. BudgetBITCH never reads or stores Gmail inbox or message content.",
      setupRequiredTitle: "Google sign-in is not configured",
      setupRequiredDescription: "Add Google OAuth credentials before using this sign-in method.",
    },
  }),
}));

import SignInPage from "./page";

describe("SignInPage", () => {
  beforeEach(() => {
    isGoogleOAuthConfiguredMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated users to the sanitized target", async () => {
    authMock.mockResolvedValue({
      user: {
        id: "google-sub-1",
        email: "alex@example.com",
        emailVerified: true,
      },
    });

    await expect(
      SignInPage({
        searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
      }),
    ).rejects.toThrow("REDIRECT:/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome");
    expect(redirectMock).toHaveBeenCalledWith(
      "/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
    );
  });

  it("renders the Google-only sign-in entry", async () => {
    authMock.mockResolvedValue(null);

    const view = await SignInPage();
    render(view);

    expect(screen.getByRole("heading", { name: /open your budget board/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getAllByText(/google is only used for secure sign-in/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/never reads or stores gmail inbox or message content/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("combobox", { name: /language/i })).toBeInTheDocument();
    expect(screen.queryByText(/email and password via clerk/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/passkey/i)).not.toBeInTheDocument();
  });

  it("shows a setup problem instead of the Google action when OAuth is not configured", async () => {
    authMock.mockResolvedValue(null);
    isGoogleOAuthConfiguredMock.mockReturnValue(false);

    const view = await SignInPage();
    render(view);

    expect(screen.getByText(/google sign-in is not configured/i)).toBeInTheDocument();
    expect(screen.getByText(/add google oauth credentials/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
  });

  it("passes only a safe redirect target to sign-up", async () => {
    authMock.mockResolvedValue(null);

    const view = await SignInPage({
      searchParams: Promise.resolve({ redirectTo: "https://evil.example/steal" }),
    });
    render(view);

    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute("href", "/sign-up");
  });

  it("preserves a safe redirect target when opening sign-up", async () => {
    authMock.mockResolvedValue(null);

    const view = await SignInPage({
      searchParams: Promise.resolve({ redirectTo: "/" }),
    });
    render(view);

    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute(
      "href",
      "/sign-up?redirectTo=%2F",
    );
  });
});