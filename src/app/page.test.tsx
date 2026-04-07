import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("../../WelcomeWindow-startup/WelcomeScreen", () => ({
  default: ({ onEnter }: { onEnter: () => void }) => (
    <button onClick={onEnter} type="button">
      Mock welcome gate
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

  it("shows the welcome gate for first-time visitors", async () => {
    render(<Home />);

    expect(
      screen.queryByRole("heading", {
        name: /plan first\. panic less\./i,
      }),
    ).not.toBeInTheDocument();

    expect(await screen.findByRole("button", { name: /mock welcome gate/i })).toBeInTheDocument();
  });

  it("shows compact route buckets for returning visitors", async () => {
    window.localStorage.setItem("budgetbitch:welcome-dismissed", "true");

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /plan first\. panic less\./i,
        }),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /build my blueprint/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.getByRole("heading", { name: /route lanes/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /build lane/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /momentum lane/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guardrail lane/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /open dashboard/i })).toHaveLength(2);
    screen.getAllByRole("link", { name: /open dashboard/i }).forEach((link) => {
      expect(link).toHaveAttribute("href", "/dashboard");
    });
    expect(screen.getByRole("link", { name: /explore jobs/i })).toHaveAttribute(
      "href",
      "/jobs",
    );
    expect(screen.getByRole("link", { name: /guard connection hub/i })).toHaveAttribute(
      "href",
      "/settings/integrations",
    );
  });
});
