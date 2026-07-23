// src/components/welcome/welcome-window.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      brand: "Budget-BOSS",
      heading: "Open your Budget-BOSS board",
      description:
        "Sign in to unlock your root flow. After that, Budget-BOSS can send you into the one-time startup questionnaire or straight to the landing board based on your saved startup progress.",
      openSignIn: "Open sign in",
      openSignUp: "Open sign-up",
      privacyPromise: "Private by default. Setup only if needed.",
      quickReasonsAria: "Welcome quick reasons",
      "quickReasons.signInFirst.title": "Sign in first",
      "quickReasons.signInFirst.description": "Open your account before the app decides whether you need setup or your landing board.",
      "quickReasons.keepItShort.title": "Keep the first step short",
      "quickReasons.keepItShort.description": "The startup questionnaire only appears after sign-in and only when your first-run progress is still incomplete.",
      "quickReasons.moveWithoutSprawl.title": "Move without the sprawl",
      "quickReasons.moveWithoutSprawl.description": "Budget-BOSS keeps the entry path dense, readable, and ready for quick scanning on smaller screens.",
      rootFlow: "Root flow",
      authFirstThenSetup: "Auth first, then setup",
      rootFlowDescription:
        "Signed-out visitors stay on this welcome window. Signed-in visitors move into the startup questionnaire only when first-run setup still needs to be completed.",
      whatChangesNext: "What changes next",
      "nextSteps.signIn": "Sign in when you already have an account.",
      "nextSteps.signUp": "Sign up when you need a fresh account before setup begins.",
      "nextSteps.finishWizard": "Finish the startup questionnaire once, then return to the landing board on future visits.",
      label: "Language",
      "options.en": "English",
      "options.zh": "简体中文",
      "options.th": "ไทย",
    };

    return translations[key] ?? key;
  },
  useLocale: () => "en",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
}));

// Mock ProTipsCard component to isolate WelcomeWindow tests
vi.mock("@/components/pro-tips/pro-tips-card", () => ({
  ProTipsCard: () => <div data-testid="pro-tips-card" />
}));

import { WelcomeWindow } from "./welcome-window";

describe("WelcomeWindow", () => {
  it("renders the welcome heading with explicit auth links, 3D letters, and slogan", () => {
    render(
      <WelcomeWindow
        signInHref="/sign-in?redirectTo=%2F"
        signUpHref="/sign-up?redirectTo=%2F"
      />,
    );

    // Verify 3D letters render
    expect(screen.getAllByText('B')).toBeDefined();
    expect(screen.getAllByText('O')).toBeDefined();
    expect(screen.getAllByText('S')).toBeDefined();

    // Verify slogan is present
    expect(screen.getByText(/["“]Shut up and do it!!!["”]/i)).toBeInTheDocument();

    // Premium-cinematic: no floating money emoji particles
    expect(screen.queryByText("🪙")).toBeNull();
    expect(screen.queryByText("💵")).toBeNull();

    // Premium-cinematic: single breathing glow + one-shot light sweep present
    expect(screen.getByTestId("welcome-breathing-glow")).toBeInTheDocument();
    expect(screen.getByTestId("welcome-light-sweep")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute(
      "href",
      "/sign-in?redirectTo=%2F",
    );
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute(
      "href",
      "/sign-up?redirectTo=%2F",
    );
    expect(screen.getByText(/private by default\. setup only if needed\./i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /language/i })).toBeInTheDocument();
    expect(screen.getByTestId("pro-tips-card")).toBeInTheDocument();
  });

  it("renders the welcome reasons as a compact list for fast scanning", () => {
    render(
      <WelcomeWindow
        signInHref="/sign-in?redirectTo=%2F"
        signUpHref="/sign-up?redirectTo=%2F"
      />,
    );

    const reasonsList = screen.getByRole("list", { name: /welcome quick reasons/i });

    expect(reasonsList).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
  });
});