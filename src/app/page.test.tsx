import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/components/launch/launch-wizard", () => ({
  LAUNCH_PROFILE_STORAGE_KEY: "budgetbitch:launch-profile",
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button onClick={onComplete} type="button">
      Mock launch wizard
    </button>
  ),
}));

describe("Home", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("shows the launch wizard before the landing board on first visit", async () => {
    render(<Home />);

    expect(
      screen.queryByRole("heading", { name: /plan first\. panic less\./i }),
    ).not.toBeInTheDocument();

    const wizardButton = await screen.findByRole("button", { name: /mock launch wizard/i });
    expect(wizardButton).toBeInTheDocument();

    fireEvent.click(wizardButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /plan first\. panic less\./i }),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: /route lanes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /build my blueprint/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
  });

  it("skips the launch wizard when a completed profile is already saved", async () => {
    window.localStorage.setItem(
      "budgetbitch:launch-profile",
      JSON.stringify({
        completed: true,
        completedAt: "2026-04-10T12:00:00.000Z",
        city: "Dublin",
        layoutPreset: "launcher_grid",
        motionPreset: "cinematic",
        themePreset: "midnight",
        cryptoPlatform: "later",
      }),
    );

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /plan first\. panic less\./i }),
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /mock launch wizard/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /route lanes/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /build lane/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /momentum lane/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guardrail lane/i })).toBeInTheDocument();
  });
});
