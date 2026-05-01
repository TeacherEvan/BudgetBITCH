import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

import LearnLessonPage from "./page";

describe("LearnLessonPage", () => {
  it("retains the full story scenes and deeper practical actions", async () => {
    const view = await LearnLessonPage({
      params: Promise.resolve({ slug: "budgeting-basics" }),
    });

    render(view);

    expect(screen.getByText("Budgeting Basics")).toBeInTheDocument();
    expect(screen.getByText("Why it matters")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Budgeting is the base layer for essentials, optional spending, and emergency breathing room.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "A raccoon CFO keeps approving snack subscriptions because nobody made a real plan.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Plain-English breakdown")).toBeInTheDocument();
    expect(screen.getByText("Apply this now")).toBeInTheDocument();
    expect(
      screen.getByText(
        "List fixed bills first, then assign the remaining money to savings, food, and flexible spending.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Takeaways")).toBeInTheDocument();
    expect(
      screen.getByText("A budget is a plan, not a punishment."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Essentials get funded before optional chaos."),
    ).toBeInTheDocument();
  });

  it("delegates to notFound for an unknown lesson slug", async () => {
    await expect(
      LearnLessonPage({ params: Promise.resolve({ slug: "missing-lesson" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
  });
});
