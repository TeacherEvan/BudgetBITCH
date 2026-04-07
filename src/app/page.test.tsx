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
        name: /financial control with a little theatrical menace/i,
      }),
    ).not.toBeInTheDocument();

    expect(await screen.findByRole("button", { name: /mock welcome gate/i })).toBeInTheDocument();
  });

  it("shows the normalized landing shell for returning visitors", async () => {
    window.localStorage.setItem("budgetbitch:welcome-dismissed", "true");

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: /financial control with a little theatrical menace/i,
        }),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: /build my blueprint/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.getByRole("link", { name: /open dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByText(/trusted connection hub/i)).toBeInTheDocument();
  });
});