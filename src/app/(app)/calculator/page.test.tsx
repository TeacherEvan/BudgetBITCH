import { render, screen } from "@testing-library/react";
import { localeMessages } from "@/i18n/messages";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/calculator/calculator", () => ({
  Calculator: () => <section aria-label="Calculator" role="region" />,
}));

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    calculatorPage: {
      eyebrow: "Tools",
      title: "Calculator",
      description: "Quick arithmetic for budget checks.",
    },
  }),
}));

import CalculatorPage from "./page";

describe("CalculatorPage", () => {
  it("renders the page heading", async () => {
    render(await CalculatorPage());
    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Calculator" })).toBeInTheDocument();
    expect(screen.getByText("Quick arithmetic for budget checks.")).toBeInTheDocument();
  });

  it("renders the calculator widget", async () => {
    render(await CalculatorPage());
    expect(screen.getByRole("region", { name: /calculator/i })).toBeInTheDocument();
  });

  it("keeps zh and th calculator descriptions aligned with the shorter shell copy", () => {
    expect(localeMessages.zh.calculatorPage.description).toBe("快速核对预算数字。");
    expect(localeMessages.th.calculatorPage.description).toBe("คำนวณตัวเลขงบประมาณแบบเร็ว");
  });
});
