import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Calculator } from "./calculator";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      regionLabel: "Calculator",
      clearButton: "Clear",
    };

    return translations[key] ?? key;
  },
}));

describe("Calculator", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("renders the display with initial value 0", () => {
    render(<Calculator />);

    expect(
      screen.getByText(/notes, calculator, and launch settings stay available on this device/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0");
    expect(screen.getByRole("button", { name: "Clear" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "=" })).toBeEnabled();
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
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("status")).toHaveTextContent("0");
  });

  it("handles decimal input", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "." }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(screen.getByRole("status")).toHaveTextContent("1.5");
  });

  it("restores a saved draft so a pending calculation can continue after remount", () => {
    const firstRender = render(<Calculator />);

    fireEvent.click(screen.getByRole("button", { name: "9" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));

    firstRender.unmount();

    render(<Calculator />);

    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "=" }));

    expect(screen.getByRole("status")).toHaveTextContent("13");
  });

  it("keeps the calculator usable when draft persistence fails", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    render(<Calculator />);

    fireEvent.click(screen.getByRole("button", { name: "4" }));

    expect(screen.getByRole("status")).toHaveTextContent("4");
  });
});
