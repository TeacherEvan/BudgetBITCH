import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppLayout from "./layout";

describe("AppLayout", () => {
  it("renders children inside a nav-wrapped shell", () => {
    render(
      <AppLayout>
        <p>page content</p>
      </AppLayout>,
    );

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders the dashboard home link", () => {
    render(
      <AppLayout>
        <span />
      </AppLayout>,
    );

    expect(screen.getByRole("link", { name: /go to dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
