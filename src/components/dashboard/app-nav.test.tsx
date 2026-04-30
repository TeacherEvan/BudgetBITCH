import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mobileRouteConfig } from "@/modules/mobile/mobile-route-config";
import { AppNav } from "./app-nav";

let mockPathname = "/dashboard";

const navTranslations: Record<string, string> = {
  mobileNavigation: "Mobile app navigation",
  desktopNavigation: "App navigation",
  openDashboard: "Go to dashboard",
  "routes.dashboard": "Dashboard",
  "routes.startSmart": "Start Smart",
  "routes.calculator": "Calculator",
  "routes.notes": "Notes",
  "routes.learn": "Learn",
  "routes.integrations": "Integrations",
  "routes.jobs": "Jobs",
};

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => navTranslations[key] ?? key,
}));

describe("AppNav", () => {
  beforeEach(() => {
    mockPathname = "/dashboard";
  });

  it("renders the shared mobile route buttons", () => {
    render(<AppNav />);

    const navigation = screen.getByRole("navigation", { name: "Mobile app navigation" });

    for (const route of mobileRouteConfig) {
      expect(
        within(navigation).getByRole("link", { name: navTranslations[`routes.${route.labelKey}`] }),
      ).toHaveAttribute(
        "href",
        route.href,
      );
    }
  });

  it("keeps the desktop dashboard shortcut available", () => {
    render(<AppNav />);

    expect(screen.getByRole("navigation", { name: "App navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });

  it("marks the current route with aria-current", () => {
    mockPathname = "/jobs";

    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("keeps the parent route active for nested pages", () => {
    mockPathname = "/settings/integrations/openai";

    render(<AppNav />);

    expect(screen.getByRole("link", { name: "Integrations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Jobs" })).not.toHaveAttribute("aria-current");
  });

  it("renders safely when pathname is unavailable", () => {
    mockPathname = null as unknown as string;

    render(<AppNav />);

    expect(screen.getByRole("navigation", { name: "Mobile app navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
});
