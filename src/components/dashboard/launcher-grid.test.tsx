import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LauncherGrid } from "./launcher-grid";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      kicker: "Tools",
      title: "Popular budgeting tools",
      description: "Open the lanes you actually use without stacking another scrolling page.",
    };

    return translations[key] ?? key;
  },
}));

describe("LauncherGrid", () => {
  it("renders popular budgeting tools as practical action cards", () => {
    render(
      <LauncherGrid
        tools={[
          {
            title: "Open setup wizard",
            href: "/start-smart",
            detail: "Configure the window before anything else.",
            label: "Wizard",
          },
          {
            title: "Open Learn",
            href: "/learn",
            detail: "Short lessons when the board needs backup.",
            label: "Learn",
          },
          {
            title: "Open Jobs",
            href: "/jobs",
            detail: "Income options for the current lane.",
            label: "Jobs",
          },
          {
            title: "Open bills",
            href: "/bills",
            detail: "Track due dates and pressure points.",
            label: "Bills",
          },
          {
            title: "Open savings",
            href: "/savings",
            detail: "Grow buffers without adding clutter.",
            label: "Savings",
          },
          {
            title: "Open cashflow",
            href: "/cashflow",
            detail: "See the burn before it gets noisy.",
            label: "Cashflow",
          },
          {
            title: "Open calculator",
            href: "/calculator",
            detail: "Quick arithmetic without leaving the board.",
            label: "Calculator",
          },
          {
            title: "Open notes",
            href: "/notes",
            detail: "Scratchpad for budget thoughts and reminders.",
            label: "Notes",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /popular budgeting tools/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open setup wizard/i })).toHaveAttribute(
      "href",
      "/start-smart",
    );
    expect(screen.getByRole("link", { name: /open cashflow/i })).toHaveAttribute(
      "href",
      "/cashflow",
    );
    expect(screen.getAllByRole("link")).toHaveLength(8);
  });
});
