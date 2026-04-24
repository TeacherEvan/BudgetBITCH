import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home, { HOME_E2E_AUTH_OVERRIDE_STORAGE_KEY } from "./page";

const clerkUseAuthMock = vi.hoisted(() => vi.fn());
const isClerkClientConfiguredMock = vi.hoisted(() => vi.fn(() => true));
const prepareLaunchTransitionResources = vi.hoisted(() => vi.fn(() => Promise.resolve()));

const launchProfile = {
  completed: true as const,
  completedAt: "2026-04-10T12:00:00.000Z",
  city: "Dublin",
  layoutPreset: "launcher_grid" as const,
  motionPreset: "cinematic" as const,
  themePreset: "midnight" as const,
  cryptoPlatform: "later" as const,
};

vi.mock("@/components/launch/launch-wizard", () => ({
  LAUNCH_PROFILE_STORAGE_KEY: "budgetbitch:launch-profile",
  default: ({ onComplete }: { onComplete: (profile: typeof launchProfile) => void }) => (
    <button onClick={() => onComplete(launchProfile)} type="button">
      Mock launch wizard
    </button>
  ),
}));

vi.mock("@/components/launch/load-money-loading-art", () => ({
  prepareLaunchTransitionResources,
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: clerkUseAuthMock,
}));

vi.mock("@/lib/auth/clerk-config", () => ({
  isClerkClientConfigured: isClerkClientConfiguredMock,
}));

describe("Home", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clerkUseAuthMock.mockReset();
    isClerkClientConfiguredMock.mockReset();
    isClerkClientConfiguredMock.mockReturnValue(true);
    clerkUseAuthMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
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
    clerkUseAuthMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
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
    expect(screen.queryByRole("button", { name: /mock launch wizard/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /plan first\. panic less\./i }),
    ).not.toBeInTheDocument();
  });

  it("shows the welcome window when Clerk client auth is not configured", async () => {
    isClerkClientConfiguredMock.mockReturnValue(false);
    clerkUseAuthMock.mockImplementation(() => {
      throw new Error("useAuth should not run without Clerk client config");
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

  it("keeps the signed-in root flow available for the no-Clerk local fallback in non-production tests", async () => {
    isClerkClientConfiguredMock.mockReturnValue(false);
    clerkUseAuthMock.mockImplementation(() => {
      throw new Error("useAuth should not run without Clerk client config");
    });
    window.localStorage.setItem(HOME_E2E_AUTH_OVERRIDE_STORAGE_KEY, "signed-in");

    render(<Home />);

    expect(
      await screen.findByRole("button", { name: /mock launch wizard/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /open your budgetbitch board/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the launch wizard for signed-in users without a saved profile", async () => {
    render(<Home />);

    expect(
      screen.queryByRole("heading", { name: /open your budgetbitch board/i }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("heading", { name: /plan first\. panic less\./i }),
    ).not.toBeInTheDocument();

    const wizardButton = await screen.findByRole("button", { name: /mock launch wizard/i });
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
    expect(screen.queryByRole("button", { name: /mock launch wizard/i })).not.toBeInTheDocument();
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

    const wizardButton = await screen.findByRole("button", { name: /mock launch wizard/i });

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

  it("shows the landing board after the wizard completes", async () => {
    render(<Home />);

    const wizardButton = await screen.findByRole("button", { name: /mock launch wizard/i });

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
