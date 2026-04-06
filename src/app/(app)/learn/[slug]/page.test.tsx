import { render, screen } from "@testing-library/react";
import LearnLessonPage from "./page";

describe("LearnLessonPage", () => {
  it("renders the story scenes and practical takeaways", async () => {
    const view = await LearnLessonPage({
      params: Promise.resolve({ slug: "budgeting-basics" }),
    });

    render(view);

    expect(screen.getByText("Budgeting Basics")).toBeInTheDocument();
    expect(screen.getByText("Plain-English breakdown")).toBeInTheDocument();
    expect(screen.getByText("Apply this now")).toBeInTheDocument();
  });
});
