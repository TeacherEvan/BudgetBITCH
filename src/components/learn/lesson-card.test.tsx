import { render, screen } from "@testing-library/react";
import { LessonCard } from "./lesson-card";

describe("LessonCard", () => {
  it("renders summary and a launch link", () => {
    render(
      <LessonCard
        lesson={{
          slug: "budgeting-basics",
          key: "budgeting_basics",
          title: "Budgeting Basics",
          category: "budgeting",
          tone: "chaotic_comedy",
          summary: "A funny first lesson about giving every dollar a job.",
          whyItMatters: "Protect essentials before optional spending.",
          blueprintSignals: ["cover_essentials"],
          scenes: [
            {
              id: "scene-1",
              absurdScenario: "A raccoon tries to expense a trampoline.",
              plainEnglish: "Plans beat chaos.",
              applyNow: "Fund essentials first.",
            },
          ],
          takeaways: ["Give each dollar a job."],
          nextActionLabel: "Open lesson",
        }}
      />,
    );

    expect(screen.getByText("Budgeting Basics")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open lesson/i })).toBeInTheDocument();
  });
});
