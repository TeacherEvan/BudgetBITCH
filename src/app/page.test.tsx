import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../WelcomeWindow-startup/WelcomeScreen", () => ({
  default: ({ onEnter }: { onEnter: () => void }) => (
    <button onClick={onEnter} type="button">
      Mock welcome gate
    </button>
  ),
}));

import Home from "./page";

describe("Home", () => {
  it("shows the landing content immediately without a welcome gate", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /plan first\. panic less\./i,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /mock welcome gate/i })).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: /build my blueprint/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.getAllByRole("link", { name: /open dashboard/i })).toHaveLength(2);
    screen.getAllByRole("link", { name: /open dashboard/i }).forEach((link) => {
      expect(link).toHaveAttribute("href", "/dashboard");
    });
    screen.getAllByRole("link", { name: /learn with context/i }).forEach((link) => {
      expect(link).toHaveAttribute("href", "/learn");
    });
    expect(screen.getByRole("heading", { name: /route lanes/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /build lane/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /momentum lane/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /guardrail lane/i })).toBeInTheDocument();

    const buildLane = screen.getByRole("heading", { name: /build lane/i }).closest("section");

    expect(buildLane).not.toBeNull();
    expect(
      within(buildLane as HTMLElement).getByRole("link", { name: /start smart/i }),
    ).toHaveAttribute("href", "/start-smart");

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
