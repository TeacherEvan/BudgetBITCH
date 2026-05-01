import { render, screen } from "@testing-library/react";
import { localeMessages } from "@/i18n/messages";
import { vi } from "vitest";

vi.mock("@/i18n/server", () => ({
  getRequestMessages: async () => ({
    learnPage: {
      eyebrow: "Learn!",
      title: "Comic-strip lessons for the money move that matters next.",
      description: "Short lessons for the money move that matters next.",
      storyCuesEyebrow: "Story cues",
      storyCuesTitle: "Quick cues for the next move",
      storyCuesDescription: "One clear cue and one action per lesson.",
      blueprintPicksEyebrow: "Blueprint picks",
      blueprintPicksTitle: "Start here",
      blueprintPicksDescription:
        "Highest-signal lessons matched to your current blueprint pressure.",
      streakEyebrow: "Keep the streak",
      streakTitle: "Next up",
      streakDescription:
        "Evergreen refreshers when you want one more useful concept without a long scroll.",
    },
  }),
}));

import LearnPage from "./page";

describe("LearnPage", () => {
  it("renders the Learn! hub headline with compact story cues", async () => {
    const view = await LearnPage();
    render(view);

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByText("Learn!")).toBeInTheDocument();
    expect(screen.getByText("Short lessons for the money move that matters next.")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Quick cues for the next move" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A budget is a decision made before the spending happens, not a post-chaos apology.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "List fixed bills first, then assign the remaining money to savings, food, and flexible spending.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/A raccoon CFO keeps approving snack subscriptions/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /These lessons are matched to your current blueprint priorities so the learning stays practical\./i,
      ),
    ).not.toBeInTheDocument();
  });

  it("renders compact lesson sections for blueprint picks and follow-ups", async () => {
    const view = await LearnPage();
    render(view);

    expect(screen.getByRole("heading", { name: "Start here" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next up" })).toBeInTheDocument();
    expect(screen.getAllByText("Budgeting Basics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Money Behavior").length).toBeGreaterThan(0);
    expect(
      screen.queryByText(
        "Budgeting is the base layer for essentials, optional spending, and emergency breathing room.",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /review your essentials/i })).toHaveAttribute(
      "href",
      "/learn/budgeting-basics",
    );
    expect(screen.getByRole("link", { name: /change one money trigger/i })).toHaveAttribute(
      "href",
      "/learn/money-behavior",
    );
  });

  it("keeps zh and th learn copy aligned with the compact cue layout", () => {
    expect(localeMessages.zh.learnPage.description).toBe("先用短课抓住眼前最重要的金钱动作。");
    expect(localeMessages.zh.learnPage.storyCuesTitle).toBe("下一步的快速提示");
    expect(localeMessages.zh.learnPage.storyCuesDescription).toBe(
      "每节课保留一个清楚提示和一个立即动作。",
    );
    expect(localeMessages.th.learnPage.description).toBe(
      "เริ่มจากบทเรียนสั้นสำหรับก้าวเรื่องเงินที่สำคัญที่สุดตอนนี้",
    );
    expect(localeMessages.th.learnPage.storyCuesTitle).toBe("คิวสั้นสำหรับก้าวถัดไป");
    expect(localeMessages.th.learnPage.storyCuesDescription).toBe(
      "แต่ละบทเรียนเหลือหนึ่งคิวที่ชัดเจนและหนึ่งอย่างให้ลงมือทำ",
    );
  });
});
