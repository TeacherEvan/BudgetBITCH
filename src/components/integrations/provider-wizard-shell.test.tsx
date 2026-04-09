import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderWizardShell } from "./provider-wizard-shell";

describe("ProviderWizardShell", () => {
  it("renders the shell copy, back link, children, and the shared tool rail", () => {
    render(
      <ProviderWizardShell
        eyebrow="OpenAI Setup"
        title="Connect OpenAI"
        description="Only connect providers you explicitly trust."
        actions={[
          { kind: "primary", label: "Open setup wizard", href: "/settings/integrations/openai" },
          { kind: "secondary", label: "Open official login", href: "https://platform.openai.com/login" },
          { kind: "tertiary", label: "Open official docs", href: "https://platform.openai.com/docs" },
        ]}
      >
        <div>Child panel one</div>
        <div>Child panel two</div>
      </ProviderWizardShell>,
    );

    expect(screen.getByText("OpenAI Setup")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connect OpenAI" })).toBeInTheDocument();
    expect(screen.getByText("Only connect providers you explicitly trust.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to connection hub" })).toHaveAttribute(
      "href",
      "/settings/integrations",
    );
    expect(screen.getByRole("heading", { name: "Tools" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
      "href",
      "/settings/integrations/openai",
    );
    expect(screen.getByText("Child panel one")).toBeInTheDocument();
    expect(screen.getByText("Child panel two")).toBeInTheDocument();
  });
});
