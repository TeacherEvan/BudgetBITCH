import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FixedScreenShell } from "./fixed-screen-shell";

describe("FixedScreenShell", () => {
  it("renders a fixed-height shell with a scrollable content region and action bar", () => {
    render(
      <FixedScreenShell
        header={<div>Header</div>}
        footer={<button type="button">Continue</button>}
      >
        <div>Panel body</div>
      </FixedScreenShell>,
    );

    expect(screen.getByTestId("fixed-screen-shell")).toHaveClass(
      "flex",
      "h-[100dvh]",
      "min-h-0",
      "flex-col",
      "overflow-hidden",
    );
    expect(screen.getByTestId("fixed-screen-shell-content")).toHaveClass(
      "min-h-0",
      "flex-1",
      "overflow-y-auto",
    );
    expect(screen.getByTestId("fixed-screen-shell-footer")).toHaveClass(
      "shrink-0",
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });
});