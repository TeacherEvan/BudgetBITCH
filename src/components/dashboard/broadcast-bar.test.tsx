import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BroadcastBar } from "./broadcast-bar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      kicker: "Local area",
      title: "Local area",
      fallbackTicker: "Budget updates",
    };

    return translations[key] ?? key;
  },
}));

describe("BroadcastBar", () => {
  it("renders the city label and ticker copy", () => {
    render(
      <BroadcastBar
        cityLabel="Dublin"
        tickerItems={[
          "Politics",
          "Science",
          "Agriculture",
          "Entertainment",
          "Investments",
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: /local area/i })).toBeInTheDocument();
    expect(screen.getByText(/dublin/i, { selector: "p.bb-mini-copy" })).toBeInTheDocument();
    expect(screen.getByText(/politics/i, { selector: "span:not([aria-hidden='true'])" })).toBeInTheDocument();
    expect(screen.getByText(/investments/i, { selector: "span:not([aria-hidden='true'])" })).toBeInTheDocument();
  });
});
