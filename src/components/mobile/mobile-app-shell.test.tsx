import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mobileRouteConfig } from "@/modules/mobile/mobile-route-config";
import { MobileAppShell } from "./mobile-app-shell";

let mockPathname = "/dashboard";

const navTranslations: Record<string, string> = {
  mobileNavigation: "Mobile app navigation",
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

describe("MobileAppShell", () => {
  beforeEach(() => {
    mockPathname = "/dashboard";
  });

  it("renders the full mobile route contract and a main content landmark", () => {
    const { container } = render(<MobileAppShell>panel</MobileAppShell>);

    const navigation = screen.getByRole("navigation", { name: "Mobile app navigation" });
    const content = container.querySelector('[data-slot="mobile-shell-content"]');

    for (const route of mobileRouteConfig) {
      expect(
        within(navigation).getByRole("link", { name: navTranslations[`routes.${route.labelKey}`] }),
      ).toHaveAttribute(
        "href",
        route.href,
      );
    }

    expect(content).not.toBeNull();
    expect(content).toHaveTextContent("panel");
  });

  it("marks the current route with aria-current", () => {
    mockPathname = "/jobs";

    render(<MobileAppShell />);

    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
});