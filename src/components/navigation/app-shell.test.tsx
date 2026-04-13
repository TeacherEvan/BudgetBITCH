import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

describe("AppShell", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the core navigation, skip link, and mobile menu trigger", () => {
    usePathnameMock.mockReturnValue("/dashboard");

    render(
      <AppShell>
        <main>Shell body</main>
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute(
      "href",
      "#app-content",
    );
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /start smart/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.getByRole("link", { name: /learn/i })).toHaveAttribute("href", "/learn");
    expect(screen.getByRole("link", { name: /jobs/i })).toHaveAttribute("href", "/jobs");
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute(
      "href",
      "/settings/integrations",
    );
    expect(screen.getByRole("button", { name: /open navigation/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByText("Shell body").closest("#app-content")).not.toBeNull();
    expect(screen.getByText("Shell body")).toBeInTheDocument();
  });

  it("marks the current route as active and toggles the mobile nav", () => {
    usePathnameMock.mockReturnValue("/start-smart");

    render(
      <AppShell>
        <div>Shell body</div>
      </AppShell>,
    );

    const activeLink = screen.getByRole("link", { name: /start smart/i });
    const navigationButton = screen.getByRole("button", { name: /open navigation/i });

    expect(activeLink).toHaveAttribute("aria-current", "page");
    expect(navigationButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(navigationButton);

    expect(navigationButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: /primary/i })).toHaveAttribute(
      "data-open",
      "true",
    );
  });
});