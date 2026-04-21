import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calculator } from "./calculator";

describe("Calculator", () => {
  it("renders the display with initial value 0", () => {
    render(<Calculator />);
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });

  it("appends digit on button press", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(screen.getByRole("status")).toHaveTextContent("4");
  });

  it("computes 3 + 5 = 8", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getByRole("status")).toHaveTextContent("8");
  });

  it("computes 9 - 4 = 5", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "9" }));
    fireEvent.click(screen.getByRole("button", { name: "−" }));
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));
    expect(screen.getByRole("status")).toHaveTextContent("5");
  });

  it("C button resets display to 0", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "7" }));
    fireEvent.click(screen.getByRole("button", { name: "C" }));
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });

  it("handles decimal input", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "." }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(screen.getByRole("status")).toHaveTextContent("1.5");
  });
});
