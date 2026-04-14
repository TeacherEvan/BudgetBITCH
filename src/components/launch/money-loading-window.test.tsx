import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MoneyLoadingWindow } from "./money-loading-window";

describe("MoneyLoadingWindow", () => {
  it("renders active loading reasons when visible", () => {
    render(<MoneyLoadingWindow visible reasons={["route"]} reducedMotion={false} />);

    expect(screen.getByText(/preparing your money board/i)).toBeInTheDocument();
  });
});