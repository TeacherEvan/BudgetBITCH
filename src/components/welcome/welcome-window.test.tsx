import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      brand: "BudgetBITCH",
      heading: "Open your BudgetBITCH board",
      description:
        "Sign in to unlock your root flow. After that, BudgetBITCH can send you into the setup wizard or straight to the landing board based on your saved launch profile.",
      openSignIn: "Open sign in",
      openSignUp: "Open sign-up",
      quickReasonsAria: "Welcome quick reasons",
      "quickReasons.signInFirst.title": "Sign in first",
      "quickReasons.signInFirst.description": "Open your account before the app decides whether you need setup or your landing board.",
      "quickReasons.keepItShort.title": "Keep the first step short",
      "quickReasons.keepItShort.description": "The setup wizard only appears after sign-in and only when your launch profile is still incomplete.",
      "quickReasons.moveWithoutSprawl.title": "Move without the sprawl",
      "quickReasons.moveWithoutSprawl.description": "BudgetBITCH keeps the entry path dense, readable, and ready for quick scanning on smaller screens.",
      rootFlow: "Root flow",
      authFirstThenSetup: "Auth first, then setup",
      rootFlowDescription:
        "Signed-out visitors stay on this welcome window. Signed-in visitors move into the wizard only when the launch profile still needs to be completed.",
      whatChangesNext: "What changes next",
      "nextSteps.signIn": "Sign in when you already have an account.",
      "nextSteps.signUp": "Sign up when you need a fresh account before setup begins.",
      "nextSteps.finishWizard": "Finish the launch wizard once, then return to the landing board on future visits.",
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

import { WelcomeWindow } from "./welcome-window";

describe("WelcomeWindow", () => {
  it("renders the welcome heading with explicit auth links", () => {
    render(
      <WelcomeWindow
        signInHref="/sign-in?redirectTo=%2F"
        signUpHref="/sign-up?redirectTo=%2F"
      />,
    );

    expect(
      screen.getByRole("heading", { name: /open your budgetbitch board/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute(
      "href",
      "/sign-in?redirectTo=%2F",
    );
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute(
      "href",
      "/sign-up?redirectTo=%2F",
    );
    expect(screen.getByRole("combobox", { name: /language/i })).toBeInTheDocument();
  });
});