import { render, screen } from "@testing-library/react";
import LearnPage from "./page";

describe("LearnPage", () => {
  it("renders the Learn! hub headline and quick story cues", async () => {
    const view = await LearnPage();
    render(view);

    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByText("Learn!")).toBeInTheDocument();
    expect(
      screen.getByText("Comic-strip lessons for the money move that matters next."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Three fast scenes to anchor the idea" }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/A raccoon CFO keeps approving snack subscriptions/i).length,
    ).toBeGreaterThan(0);
  });

  it("renders compact lesson sections for blueprint picks and follow-ups", async () => {
    const view = await LearnPage();
    render(view);

    expect(screen.getByRole("heading", { name: "Start here" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Next up" })).toBeInTheDocument();
    expect(screen.getAllByText("Budgeting Basics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Money Behavior").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /review your essentials/i })).toHaveAttribute(
      "href",
      "/learn/budgeting-basics",
    );
    expect(screen.getByRole("link", { name: /change one money trigger/i })).toHaveAttribute(
      "href",
      "/learn/money-behavior",
    );
  });
});
