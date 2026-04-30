import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home, { HOME_E2E_AUTH_OVERRIDE_STORAGE_KEY } from "./page";

const useSessionMock = vi.hoisted(() => vi.fn());
const prepareLaunchTransitionResources = vi.hoisted(() => vi.fn(() => Promise.resolve()));

const launchProfile = {
  completed: true as const,
  completedAt: "2026-04-10T12:00:00.000Z",
  expenses: [{ title: "Rent or mortgage", amount: 1200 }],
};

vi.mock("@/components/launch/launch-wizard", () => ({
  LAUNCH_PROFILE_STORAGE_KEY: "budgetbitch:launch-profile",
  default: ({ onComplete }: { onComplete: (profile: typeof launchProfile) => void }) => (
    <button onClick={() => onComplete(launchProfile)} type="button">
      Mock startup questionnaire
    </button>
  ),
}));

vi.mock("@/components/launch/load-money-loading-art", () => ({
  prepareLaunchTransitionResources,
}));

vi.mock("next-auth/react", () => ({
  useSession: useSessionMock,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      brand: "BudgetBITCH",
      heading: "Open your BudgetBITCH board",
      description:
        "Sign in to unlock your root flow. After that, BudgetBITCH can send you into the one-time startup questionnaire or straight to the landing board based on your saved startup progress.",
      openSignIn: "Open sign in",
      openSignUp: "Open sign-up",
      quickReasonsAria: "Welcome quick reasons",
      "quickReasons.signInFirst.title": "Sign in first",
      "quickReasons.signInFirst.description": "Open your account before the app decides whether you need setup or your landing board.",
      "quickReasons.keepItShort.title": "Keep the first step short",
      "quickReasons.keepItShort.description": "The startup questionnaire only appears after sign-in and only when your first-run progress is still incomplete.",
      "quickReasons.moveWithoutSprawl.title": "Move without the sprawl",
      "quickReasons.moveWithoutSprawl.description": "BudgetBITCH keeps the entry path dense, readable, and ready for quick scanning on smaller screens.",
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

describe("Home", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useSessionMock.mockReset();
    useSessionMock.mockReturnValue({
      status: "authenticated",
    });
    prepareLaunchTransitionResources.mockReset();
    prepareLaunchTransitionResources.mockImplementation(() => Promise.resolve());
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion") ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the welcome window for signed-out users", async () => {
    useSessionMock.mockReturnValue({
      status: "unauthenticated",
    });

    render(<Home />);

    expect(
      await screen.findByRole("heading", { name: /open your budgetbitch board/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute(
      "href",
      "/sign-in?redirectTo=%2F",
    );
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute(
      "href",
      "/sign-up?redirectTo=%2F",
    );
    expect(
      screen.queryByRole("button", { name: /mock startup questionnaire/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /plan first\. panic less\./i }),
    ).not.toBeInTheDocument();
  });

  it("shows an explicit loading window while session auth is unresolved", () => {
    useSessionMock.mockReturnValue({
      status: "loading",
    });

    render(<Home />);

    expect(screen.getByText(/preparing your money board/i)).toBeInTheDocument();
    expect(screen.getByText(/active work: auth/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /open your budgetbitch board/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the welcome window when the session is unauthenticated", async () => {
    useSessionMock.mockReturnValue({
      status: "unauthenticated",
    });

    render(<Home />);

    expect(
      await screen.findByRole("heading", { name: /open your budgetbitch board/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute(
      "href",
      "/sign-in?redirectTo=%2F",
    );
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute(
      "href",
      "/sign-up?redirectTo=%2F",
    );
  });

  it("keeps the signed-in root flow available for the local signed-in override in non-production tests", async () => {
    useSessionMock.mockReturnValue({
      status: "unauthenticated",
    });
    window.localStorage.setItem(HOME_E2E_AUTH_OVERRIDE_STORAGE_KEY, "signed-in");

    render(<Home />);

    expect(
      await screen.findByRole("button", { name: /mock startup questionnaire/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /open your budgetbitch board/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the startup questionnaire for signed-in users without saved startup progress", async () => {
    render(<Home />);

    expect(
      screen.queryByRole("heading", { name: /open your budgetbitch board/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("heading", { name: /plan first\. panic less\./i }),
    ).not.toBeInTheDocument();

    const wizardButton = await screen.findByRole("button", { name: /mock startup questionnaire/i });
    expect(wizardButton).toBeInTheDocument();

    expect(screen.queryByRole("heading", { name: /open your budgetbitch board/i })).not.toBeInTheDocument();
  });

  it("shows the landing board for signed-in users with a completed saved profile", async () => {
    window.localStorage.setItem(
      "budgetbitch:launch-profile",
      JSON.stringify(launchProfile),
    );

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /plan first\. panic less\./i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mock startup questionnaire/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /open your budgetbitch board/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /route lanes/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /build lane/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /momentum lane/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guardrail lane/i })).toBeInTheDocument();
  });

  it("shows the loading window while wizard completion transition work is pending", async () => {
    prepareLaunchTransitionResources.mockImplementation(
      () => new Promise((resolve) => window.setTimeout(resolve, 400)),
    );

    render(<Home />);

    const wizardButton = await screen.findByRole("button", { name: /mock startup questionnaire/i });

    vi.useFakeTimers();

    try {
      await act(async () => {
        fireEvent.click(wizardButton);
        await vi.advanceTimersByTimeAsync(275);
      });

      expect(screen.getByText(/preparing your money board/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the landing board after the startup questionnaire completes", async () => {
    render(<Home />);

    const wizardButton = await screen.findByRole("button", { name: /mock startup questionnaire/i });

    fireEvent.click(wizardButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /plan first\. panic less\./i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /route lanes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /build my blueprint/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.queryByText(/preparing your money board/i)).not.toBeInTheDocument();
  });
});
