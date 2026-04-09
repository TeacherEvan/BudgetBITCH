import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToolRail } from "./tool-rail";

describe("ToolRail", () => {
  it("renders explicit primary, secondary, and tertiary actions", () => {
    render(
      <ToolRail
        title="Tools"
        actions={[
          { kind: "primary", label: "Open setup wizard", href: "/settings/integrations/openai" },
          { kind: "secondary", label: "Open official login", href: "https://platform.openai.com/login" },
          { kind: "tertiary", label: "Open official docs", href: "https://platform.openai.com/docs" },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Tools" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
      "href",
      "/settings/integrations/openai",
    );
    expect(screen.getByRole("link", { name: "Open official login" })).toHaveAttribute(
      "href",
      "https://platform.openai.com/login",
    );
    expect(screen.getByRole("link", { name: "Open official docs" })).toHaveAttribute(
      "href",
      "https://platform.openai.com/docs",
    );
  });
});
