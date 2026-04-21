import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppNav } from "./app-nav";

describe("AppNav", () => {
  it("renders a link that goes to the dashboard", () => {
    render(<AppNav />);
    const link = screen.getByRole("link", { name: /go to dashboard/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("has a nav landmark", () => {
    render(<AppNav />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
