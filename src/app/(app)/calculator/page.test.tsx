import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/calculator/calculator", () => ({
  Calculator: () => <section aria-label="Calculator" role="region" />,
}));

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    calculatorPage: {
      eyebrow: "Tools",
      title: "Calculator",
      description: "Quick arithmetic for budget checks — no number crunching in your head.",
    },
  }),
}));

import CalculatorPage from "./page";

describe("CalculatorPage", () => {
  it("renders the page heading", async () => {
    render(await CalculatorPage());
    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Calculator" })).toBeInTheDocument();
  });

  it("renders the calculator widget", async () => {
    render(await CalculatorPage());
    expect(screen.getByRole("region", { name: /calculator/i })).toBeInTheDocument();
  });
});
