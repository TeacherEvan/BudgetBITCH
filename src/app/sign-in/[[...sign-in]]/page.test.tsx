import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isAuthenticatedNextjsMock = vi.hoisted(() => vi.fn(() => false));
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

vi.mock("@convex-dev/auth/nextjs/server", () => ({
  isAuthenticatedNextjs: isAuthenticatedNextjsMock,
}));

vi.mock("@/components/auth/convex-password-auth-form", () => ({
  ConvexPasswordAuthForm: ({ submitLabel }: { submitLabel: string }) => (
    <button type="button">{submitLabel}</button>
  ),
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
    signIn: {
      eyebrow: "Sign in",
      title: "Open your budget board",
      description:
        "Use your BudgetBITCH account, then let the app finish local setup for your workspace before the dashboard opens.",
      needAccount: "Need an account?",
      openSignUp: "Open sign-up",
      continueWithGoogle: "Sign in",
      submit: "Sign in",
      emailLabel: "Email",
      passwordLabel: "Password",
      privacy:
        "Users do not add env files. The app owner configures Convex once, and users sign in here.",
      setupRequiredTitle: "Convex Auth is not configured",
      setupRequiredDescription: "Connect the Convex deployment before using this sign-in method.",
    },
  }),
}));

import SignInPage from "./page";

describe("SignInPage", () => {
  beforeEach(() => {
    isAuthenticatedNextjsMock.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated users to the sanitized target", async () => {
    isAuthenticatedNextjsMock.mockResolvedValue(true);

    await expect(
      SignInPage({
        searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
      }),
    ).rejects.toThrow("REDIRECT:/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome");
    expect(redirectMock).toHaveBeenCalledWith(
      "/auth/continue?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
    );
  });

  it("renders the Convex email sign-in entry", async () => {
    const view = await SignInPage();
    render(view);

    expect(screen.getByRole("heading", { name: /open your budget board/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/no google oauth client/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("combobox", { name: /language/i })).toBeInTheDocument();
    expect(screen.queryByText(/passkey/i)).not.toBeInTheDocument();
  });

  it("passes only a safe redirect target to sign-up", async () => {
    const view = await SignInPage({
      searchParams: Promise.resolve({ redirectTo: "https://evil.example/steal" }),
    });
    render(view);

    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute("href", "/sign-up");
  });

  it("preserves a safe redirect target when opening sign-up", async () => {
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