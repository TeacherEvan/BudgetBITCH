import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppLayout from "./layout";

describe("AppLayout", () => {
  it("renders children inside the mobile app shell", () => {
    const { container } = render(
      <AppLayout>
        <p>page content</p>
      </AppLayout>,
    );

    expect(screen.getByRole("navigation", { name: "Mobile app navigation" })).toBeInTheDocument();
    const content = container.querySelector('[data-slot="mobile-shell-content"]');

    expect(container.firstChild).toHaveClass("bb-mobile-shell");
    expect(content).not.toBeNull();
    expect(content).toHaveClass("bb-mobile-content");
    expect(content).toHaveTextContent("page content");
  });

  it("renders the shared mobile route contract", () => {
    render(
      <AppLayout>
        <span />
      </AppLayout>,
    );

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "Jobs" })).toHaveAttribute("href", "/jobs");
  });
});
