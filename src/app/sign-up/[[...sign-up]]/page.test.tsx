import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const isAuthenticatedNextjsMock = vi.hoisted(() => vi.fn(() => false));

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

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

vi.mock("@convex-dev/auth/nextjs/server", () => ({
  isAuthenticatedNextjs: isAuthenticatedNextjsMock,
}));

vi.mock("@/components/auth/convex-password-auth-form", () => ({
  ConvexPasswordAuthForm: ({ submitLabel }: { submitLabel: string }) => (
    <button type="button">{submitLabel}</button>
  ),
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
      minimalData: "BudgetBITCH keeps only the minimal account data it needs.",
      whyThisStepExists: "Why this step exists",
      localProfileFirst: "Local profile first",
      localProfileDescription: "BudgetBITCH creates local records after auth.",
    },
    signUp: {
      eyebrow: "Create account",
      title: "Create your budget account",
      description: "Choose an email and password.",
      haveAccount: "Already have an account?",
      openSignIn: "Open sign in",
      submit: "Create account",
      emailLabel: "Email",
      passwordLabel: "Password",
      privacy: "Use at least 8 characters.",
    },
  }),
}));

import SignUpPage from "./page";

describe("SignUpPage", () => {
  beforeEach(() => {
    isAuthenticatedNextjsMock.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Convex account creation form", async () => {
    render(await SignUpPage());

    expect(screen.getByRole("heading", { name: /create your budget account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute("href", "/sign-in");
  });

  it("redirects authenticated sign-up traffic to auth continue", async () => {
    isAuthenticatedNextjsMock.mockResolvedValue(true);

    await expect(SignUpPage()).rejects.toThrow("REDIRECT:/auth/continue");
    expect(redirectMock).toHaveBeenCalledWith("/auth/continue");
  });

  it("drops unsafe redirect targets when linking to sign-in", async () => {
    render(
      await SignUpPage({
        searchParams: Promise.resolve({ redirectTo: "https://evil.example/steal" }),
      }),
    );

    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute("href", "/sign-in");
  });

  it("preserves a safe dashboard target when linking to sign-in", async () => {
    render(
      await SignUpPage({
        searchParams: Promise.resolve({ redirectTo: "/dashboard?from=welcome" }),
      }),
    );

    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute(
      "href",
      "/sign-in?redirectTo=%2Fdashboard%3Ffrom%3Dwelcome",
    );
  });
});