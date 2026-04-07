import { render, screen } from "@testing-library/react";
import LearnPage from "./page";

describe("LearnPage", () => {
  it("renders the Learn! hub headline and starter lesson cards", async () => {
    const view = await LearnPage();
    render(view);

    expect(screen.getByText("Learn!")).toBeInTheDocument();
    expect(
      screen.getByText("Absurd lessons. Real money moves."),
    ).toBeInTheDocument();
    expect(screen.getByText("Budgeting Basics")).toBeInTheDocument();
  });

  it("renders explainer copy plus primary and evergreen lesson sections", async () => {
    const view = await LearnPage();
    render(view);

    expect(
      screen.getByRole("heading", { name: "Why these lessons" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "These lessons are matched to your current blueprint priorities so the learning stays practical.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Recommended for your blueprint" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Keep learning" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Money Behavior")).toBeInTheDocument();
    expect(screen.getByText("Inflation and Opportunity Cost")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review your essentials" }),
    ).toHaveAttribute("href", "/learn/budgeting-basics");
    expect(
      screen.getByRole("link", { name: "Change one money trigger" }),
    ).toHaveAttribute("href", "/learn/money-behavior");
  });
});
