import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CalculatorPage from "./page";

describe("CalculatorPage", () => {
  it("renders the page heading", () => {
    render(<CalculatorPage />);
    expect(screen.getByRole("heading", { name: /calculator/i })).toBeInTheDocument();
  });

  it("renders the calculator widget", () => {
    render(<CalculatorPage />);
    expect(screen.getByRole("region", { name: /calculator/i })).toBeInTheDocument();
  });
});
