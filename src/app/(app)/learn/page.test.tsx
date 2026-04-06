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
});
